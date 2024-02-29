/// <reference types="react" />
interface NoticeProps {
    icon: React.ReactNode;
    title: React.ReactNode;
    text?: React.ReactNode;
    linkText?: React.ReactNode;
    linkHref?: string;
    linkTarget?: '_blank' | undefined;
    className?: string;
    onDismiss?: () => void;
    dismissKey?: string;
}
/**
 * Renders notices component with icon, title, optional link, and dismiss button.
 * Handles dismissing state using localstorage based on the given dismissKey.
 * Dismiss behavior can be overridden by passing an onDismiss callback.
 */
export declare const Notice: React.FunctionComponent<React.PropsWithChildren<NoticeProps>>;
export {};
//# sourceMappingURL=Notice.d.ts.map