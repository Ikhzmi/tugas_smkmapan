<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\Exam;
use App\Models\ExamCode;
use App\Models\ExamEvent;
use App\Models\ExamUnlock;
use App\Models\Question;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class ExamService
{
    /** @return array{status:int,message:string,code?:string,data?:mixed} */
    public function start(Exam $exam, Student $student): array
    {
        $now = now();

        if (! $exam->is_active || $exam->questions()->doesntExist()) {
            return ['status' => 422, 'message' => 'Ujian belum tersedia.', 'code' => 'EXAM_NOT_AVAILABLE'];
        }

        if (! $exam->admin_override && (($exam->waktu_mulai && $now->lessThan($exam->waktu_mulai)) || ($exam->waktu_selesai && $now->greaterThan($exam->waktu_selesai)))) {
            return ['status' => 422, 'message' => 'Sesi ujian tidak sedang berlangsung.', 'code' => 'EXAM_SESSION_CLOSED'];
        }

        if ($exam->butuh_kode && ! ExamUnlock::query()->where('exam_id', $exam->getKey())->where('student_id', $student->getKey())->exists()) {
            return ['status' => 403, 'message' => 'Ujian memerlukan kode akses.', 'code' => 'EXAM_CODE_REQUIRED'];
        }

        $existing = Attempt::query()->where('exam_id', $exam->getKey())->where('student_id', $student->getKey())->latest('dimulai_at')->first();

        if ($existing?->status === 'berjalan') {
            return ['status' => 409, 'message' => 'Ujian sedang berjalan.', 'code' => 'ATTEMPT_ACTIVE', 'data' => $this->payload($existing)];
        }

        if ($existing) {
            return ['status' => 409, 'message' => 'Ujian sudah dikerjakan dan tidak dapat diulang.', 'code' => 'ATTEMPT_COMPLETED', 'data' => $this->payload($existing)];
        }

        $order = $exam->questions()->pluck('id')->all();
        if ($exam->acak_soal) {
            shuffle($order);
        }

        $attempt = DB::transaction(function () use ($exam, $student, $order, $now): Attempt {
            return Attempt::query()->create([
                'exam_id' => $exam->getKey(),
                'student_id' => $student->getKey(),
                'status' => 'berjalan',
                'dimulai_at' => $now,
                'question_order' => $order,
            ]);
        });

        return ['status' => 201, 'message' => 'Ujian dimulai.', 'data' => $this->payload($attempt)];
    }

    /** @return array<string,mixed> */
    public function payload(Attempt $attempt): array
    {
        $attempt->loadMissing(['exam', 'answers']);
        $ids = $attempt->question_order ?: $attempt->exam->questions()->pluck('id')->all();
        $questions = Question::query()->whereIn('id', $ids)->get()->keyBy('id');
        $answers = $attempt->answers->mapWithKeys(fn (Answer $answer): array => [$answer->question_id => $answer->jawaban])->all();

        return [
            'id' => $attempt->getKey(),
            'exam_id' => $attempt->exam_id,
            'status' => $attempt->status,
            'dimulai_at' => $attempt->dimulai_at?->toISOString(),
            'dikumpulkan_at' => $attempt->dikumpulkan_at?->toISOString(),
            'nilai_akhir' => $attempt->status === 'berjalan' ? null : $attempt->nilai_akhir,
            'warnings' => $attempt->warnings,
            'questions' => array_values(array_filter(array_map(function (string $id) use ($questions): ?array {
                $question = $questions->get($id);
                if (! $question) {
                    return null;
                }

                return [
                    'id' => $question->getKey(),
                    'tipe' => $question->tipe,
                    'pertanyaan' => $question->pertanyaan,
                    'opsi' => Question::normalizeOpsi($question->opsi),
                    'bobot' => $question->bobot,
                    'gambar_url' => $question->gambar_url,
                ];
            }, $ids))),
            'answers' => $answers,
        ];
    }

    /** @return array{status:int,message:string,code?:string,data?:mixed} */
    public function answer(Attempt $attempt, string $questionId, ?string $answer): array
    {
        if ($attempt->status !== 'berjalan') {
            return ['status' => 409, 'message' => 'Attempt sudah tidak aktif.', 'code' => 'ATTEMPT_CLOSED'];
        }

        if ($this->expired($attempt)) {
            $this->submit($attempt);

            return ['status' => 409, 'message' => 'Waktu ujian sudah habis.', 'code' => 'ATTEMPT_EXPIRED'];
        }

        if (! in_array($questionId, $attempt->question_order ?: [], true)) {
            return ['status' => 404, 'message' => 'Soal tidak ditemukan pada attempt ini.', 'code' => 'QUESTION_NOT_IN_ATTEMPT'];
        }

        $saved = Answer::query()->updateOrCreate(
            ['attempt_id' => $attempt->getKey(), 'question_id' => $questionId],
            ['jawaban' => $answer],
        );

        return ['status' => 200, 'message' => 'Jawaban tersimpan.', 'data' => ['question_id' => $saved->question_id, 'jawaban' => $saved->jawaban]];
    }

    /** @return array{status:int,message:string,code?:string,data?:mixed} */
    public function submit(Attempt $attempt): array
    {
        if ($attempt->status !== 'berjalan') {
            return ['status' => 409, 'message' => 'Attempt sudah tidak aktif.', 'code' => 'ATTEMPT_CLOSED', 'data' => $this->payload($attempt)];
        }

        $questions = Question::query()->whereIn('id', $attempt->question_order ?: [])->get()->keyBy('id');
        $answers = $attempt->answers()->get()->keyBy('question_id');
        $total = (float) $questions->sum('bobot');
        $correct = $questions->sum(function (Question $question) use ($answers): float {
            $answer = $answers->get($question->getKey());

            return $answer && strtoupper(trim((string) $answer->jawaban)) === strtoupper((string) $question->kunci_jawaban) ? (float) $question->bobot : 0;
        });
        $score = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

        DB::transaction(function () use ($attempt, $score): void {
            $attempt->update(['status' => 'selesai', 'nilai_akhir' => $score, 'dikumpulkan_at' => now()]);
            $this->event($attempt, 'submitted', 'Attempt dikumpulkan.');
        });

        return ['status' => 200, 'message' => 'Ujian berhasil dikumpulkan.', 'data' => $this->payload($attempt->fresh())];
    }

    /** @return array{status:int,message:string,code?:string,data?:mixed} */
    public function terminate(Attempt $attempt, string $reason): array
    {
        if ($attempt->status !== 'berjalan') {
            return ['status' => 409, 'message' => 'Attempt sudah tidak aktif.', 'code' => 'ATTEMPT_CLOSED'];
        }

        $attempt->update(['status' => 'dibatalkan', 'alasan_berhenti' => $reason, 'dihentikan_at' => now()]);
        $this->event($attempt, 'terminated', $reason);

        return ['status' => 200, 'message' => 'Attempt dihentikan.', 'data' => $this->payload($attempt->fresh())];
    }

    /** @return array{status:int,message:string,code?:string,data?:mixed} */
    public function warning(Attempt $attempt): array
    {
        if ($attempt->status !== 'berjalan') {
            return ['status' => 409, 'message' => 'Attempt sudah tidak aktif.', 'code' => 'ATTEMPT_CLOSED'];
        }

        $attempt->increment('warnings');
        $attempt->refresh();
        $this->event($attempt, 'warning', 'Peringatan anti-curang ke-'.$attempt->warnings.'.');

        if ($attempt->warnings >= 3) {
            return $this->terminate($attempt, 'Ujian dihentikan setelah tiga peringatan anti-curang.');
        }

        return ['status' => 200, 'message' => 'Peringatan dicatat.', 'data' => ['warnings' => $attempt->warnings]];
    }

    public function generateCode(Exam $exam, int $length = 6): string
    {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($index = 0; $index < $length; $index++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }

        ExamCode::query()->updateOrCreate(['exam_id' => $exam->getKey()], ['code' => $code, 'is_active' => true]);
        $exam->update(['butuh_kode' => true]);

        return $code;
    }

    public function unlock(Exam $exam, Student $student, string $code): bool
    {
        $examCode = ExamCode::query()->where('exam_id', $exam->getKey())->where('is_active', true)->first();
        if (! $examCode || ! hash_equals(strtoupper($examCode->code), strtoupper(trim($code)))) {
            return false;
        }

        ExamUnlock::query()->updateOrCreate(['exam_id' => $exam->getKey(), 'student_id' => $student->getKey()], ['unlocked_at' => now()]);

        return true;
    }

    private function expired(Attempt $attempt): bool
    {
        $attempt->loadMissing('exam');
        $deadline = $attempt->dimulai_at->copy()->addMinutes($attempt->exam->durasi_menit);
        if (! $attempt->exam->admin_override && $attempt->exam->waktu_selesai && $attempt->exam->waktu_selesai->lessThan($deadline)) {
            $deadline = $attempt->exam->waktu_selesai;
        }

        return now()->greaterThanOrEqualTo($deadline);
    }

    private function event(Attempt $attempt, string $type, string $message): void
    {
        $attempt->loadMissing('exam');
        ExamEvent::query()->create([
            'teacher_id' => $attempt->exam->teacher_id,
            'exam_id' => $attempt->exam_id,
            'attempt_id' => $attempt->getKey(),
            'student_id' => $attempt->student_id,
            'type' => $type,
            'message' => $message,
            'created_at' => now(),
        ]);
    }
}
