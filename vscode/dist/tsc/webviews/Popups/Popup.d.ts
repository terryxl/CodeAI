/// <reference types="react" />
interface PopupOpenProps {
    isOpen: boolean;
    onDismiss: () => void;
}
interface PopupFrameProps {
    classNames?: string[];
    actionButtons?: React.ReactNode;
}
export declare const PopupFrame: React.FunctionComponent<React.PropsWithChildren<PopupFrameProps & PopupOpenProps>>;
export {};
//# sourceMappingURL=Popup.d.ts.map