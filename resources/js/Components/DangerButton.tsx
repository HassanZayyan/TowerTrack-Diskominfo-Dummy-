import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Red survives here, and ONLY here among the button primitives. After this
 * migration red no longer means "this is our brand" — it means "this is
 * irreversible". Keeping destructive red distinct from the retired brand red
 * is the whole point of the palette change.
 *
 * Hover goes DARKER (destructive-strong #B91C1C, 6.47:1) rather than lighter:
 * the old hover:bg-red-500 reduced contrast on the state that most needs it.
 *
 * THE ICON IS PART OF THE CONTRACT, NOT DECORATION.
 *
 * `app.css:118-120` states it as a MUST, and the reason is specific to this
 * palette: the brand IS red here, so hue on its own cannot separate "this is
 * ours" from "this deletes something". `--destructive` and `--primary` are
 * split by lightness, but that gap is not wide enough to carry the meaning
 * alone. Colour is the second channel; the icon and an explicit verb are the
 * first.
 *
 * Both call sites rendered bare text, so the rule was written down and not
 * kept. The icon is now rendered by the component, which means it cannot be
 * forgotten at a call site. Pass `icon` to substitute a different one, or
 * `icon={null}` for the rare control whose label already carries a glyph.
 */
interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Defaults to a trash glyph. Pass `null` only if the label carries its own. */
    icon?: ReactNode;
}

export default function DangerButton({
    className = '',
    disabled,
    children,
    icon,
    ...props
}: DangerButtonProps) {
    const glyph = icon === undefined ? <Trash2 aria-hidden="true" /> : icon;

    return (
        <button
            {...props}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2',
                'text-sm font-medium transition-colors duration-140 ease-state',
                'bg-destructive text-destructive-foreground hover:bg-destructive-strong',
                'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                // Matches the sizing the shadcn Button applies to its own icons,
                // so a DangerButton and a `variant="destructive"` Button sitting
                // next to each other do not disagree about glyph size.
                '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                className,
            )}
            disabled={disabled}
        >
            {glyph}
            {children}
        </button>
    );
}
