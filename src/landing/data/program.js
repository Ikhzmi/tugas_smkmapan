const waNumber = '+6282165415890'

function waLink(name) {
  const text = encodeURIComponent(
    `Assalamu'alaikum saya ingin bertanya, apakah pendaftaran untuk jurusan '${name}' masih terbuka?`,
  )
  return `https://wa.me/${waNumber}?text=${text}`
}

const programs = [
  {
    id: 'tkj',
    shortName: 'TKJ',
    name: 'Teknik Komputer dan Jaringan',
    description:
      'Membangun dan mengelola jaringan, perangkat keras, serta infrastruktur IT.',
    features: [
      'Administrasi Infrastruktur Jaringan',
      'Teknologi Jaringan Berbasis Luas',
      'Perakitan Komputer',
    ],
    icon: 'network',
    accent: '#38BDF8',
    image: '/images/tkj.png',
    imageInvert: false,
  },
  {
    id: 'dkv',
    shortName: 'DKV',
    name: 'Desain Komunikasi Visual',
    description:
      'Mengasah kreativitas desain, ilustrasi, fotografi, dan multimedia.',
    features: ['Mendesain', 'Videografi', 'Fotografi'],
    icon: 'palette',
    accent: '#C084FC',
    image: '/images/dkv.png',
    imageInvert: false,
  },
  {
    id: 'akuntansi',
    shortName: 'AK',
    name: 'Akuntansi',
    description:
      'Menguasai pembukuan, akuntansi dagang, dan komputer akuntansi.',
    features: [
      'Akuntansi Dagang dan Manufaktur',
      'Akuntansi Lembaga Pemerintah',
      'Komputer Akuntansi',
    ],
    icon: 'calculator',
    accent: '#34D399',
    image: '/images/akuntansi.png',
    imageInvert: true,
  },
  {
    id: 'tbsm',
    shortName: 'TBSM',
    name: 'Teknik Bisnis Sepeda Motor',
    description:
      'Merawat dan memperbaiki sepeda motor modern secara profesional.',
    features: [
      'Service Berkala Sepeda Motor',
      'Overhoul Engine & Komponennya',
      'Perbaikan Sistem Kelistrikan',
    ],
    icon: 'wrench',
    accent: '#FB923C',
    image: '/images/tsm.png',
    imageInvert: true,
  },
]

export const programKeahlian = programs.map((program) => ({
  ...program,
  href: waLink(program.name),
}))
