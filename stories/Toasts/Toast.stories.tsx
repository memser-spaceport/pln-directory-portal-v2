import capitalize from 'lodash/capitalize';
import { TypeOptions } from 'react-toastify';
import { Meta, StoryObj } from '@storybook/nextjs-vite';

import ToastContainer, { toast } from '@/components/core/ToastContainer';

import s from './Toasts.module.scss';

const meta = {
  title: 'Components/Toasts',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toasts: Story = {
  render: () => (
    <div>
      <h3>Size of toast depends on screen size. Small for screens less than 960px.</h3>
      <ToastContainer />

      {(['default', 'error', 'info', 'success', 'warning'] as TypeOptions[]).map((type) => {
        function openToast() {
          toast('Hello World', { type, autoClose: 3000 });
        }

        function openToastWithBg() {
          toast('Hello World', {
            type,
            data: {
              withBg: true,
            },
          });
        }

        return (
          <div className={s.row} key={type}>
            <button onClick={openToast}>{capitalize(type)}</button>
            <button onClick={openToastWithBg}>With BG</button>
          </div>
        );
      })}
    </div>
  ),
};
