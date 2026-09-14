import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
    }[maxWidth];

    return (
        /*
         * THREE THINGS WERE BROKEN HERE, AND ALL FIVE DIALOGS BUILT ON THIS
         * COMPONENT INHERITED THEM.
         *
         * 1. Nothing transitioned. Headless UI applies the enter/leave classes,
         *    but it is on you to declare WHICH properties transition. The panel
         *    carried `transition-colors` — colour, background, border,
         *    decoration, fill, stroke — while the enter/leave states changed
         *    `opacity` and `transform`. The scrim declared no transition
         *    property at all. So the durations and easings below applied to
         *    nothing, and both surfaces snapped. Same bug AlertToast and
         *    StaggeredContainer each had; `transition` (which does cover
         *    opacity and transform) is the fix.
         *
         * 2. The scrim was invisible. `bg-muted0/75` is not a class — almost
         *    certainly `bg-gray-500/75` caught by a careless replace during the
         *    token migration. Tailwind emitted nothing for it, so every dialog
         *    opened over a fully transparent backdrop.
         *
         * 3. The timings were off-scale. 300/200 with stock `ease-out`/
         *    `ease-in` instead of the project's 260/180 on `ease-enter`/
         *    `ease-exit` — the scale that keeps exit at ~0.7x enter.
         */
        <Transition show={show} leave="duration-180">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 sm:overflow-hidden sm:px-0"
                onClose={close}
            >
                <TransitionChild
                    enter="transition ease-enter duration-260"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-exit duration-180"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-ink-950/60" />
                </TransitionChild>

                <TransitionChild
                    enter="transition ease-enter duration-260"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="transition ease-exit duration-180"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel className={`mb-6 w-full transform sm:mx-auto ${maxWidthClass}`}>
                        <div className="flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-lg bg-card shadow-md">
                            {children}
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
