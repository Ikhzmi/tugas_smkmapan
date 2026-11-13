import React, { useEffect } from 'react';
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import teddyRiv from '../../assets/animasi/13321-25212-auth-teddy.riv?url';
import './TeddyMascot.css';

const STATE_MACHINE = 'Login Machine';

// Input state machine Rive adalah objek mutable di luar siklus render React.
const setRiveInput = (input, value) => {
  if (input) input.value = value;
};

export default function TeddyMascot({ focus = null, showPassword = false }) {
  const { rive, RiveComponent } = useRive({
    src: teddyRiv,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
  });

  const isFocus = useStateMachineInput(rive, STATE_MACHINE, 'isFocus');
  const isPrivateField = useStateMachineInput(rive, STATE_MACHINE, 'isPrivateField');
  const isPrivateFieldShow = useStateMachineInput(rive, STATE_MACHINE, 'isPrivateFieldShow');

  const passwordFocused = focus === 'password';

  useEffect(() => {
    // Saat kata sandi diketik teddy menutup mata; tombol lihat membuatnya mengintip.
    setRiveInput(isFocus, focus !== null || showPassword);
    setRiveInput(isPrivateField, passwordFocused || showPassword);
    setRiveInput(isPrivateFieldShow, showPassword);
  }, [focus, passwordFocused, showPassword, isFocus, isPrivateField, isPrivateFieldShow]);

  return (
    <div className="teddy-stage" aria-hidden="true">
      <RiveComponent className="teddy-canvas" />
    </div>
  );
}
