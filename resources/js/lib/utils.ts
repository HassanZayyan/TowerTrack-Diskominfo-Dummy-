import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose Tailwind class names.
 *
 * clsx assembles the list (handling conditionals, arrays and objects); twMerge
 * then resolves Tailwind class-group conflicts on a last-wins basis. The order
 * matters: assemble first, dedupe second.
 *
 * This is what makes `<Button className="bg-success">` actually override the
 * variant's own `bg-primary`, instead of losing to CSS source order.
 *
 * Note for whoever upgrades this later: tailwind-merge must stay on v2 while
 * the project is on Tailwind v3. v3 of tailwind-merge is built for Tailwind
 * v4's class grammar and mis-merges v3 classes silently.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
