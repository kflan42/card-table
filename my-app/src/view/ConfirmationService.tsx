import * as React from "react";
import { ConfirmationDialog, ConfirmationOptions } from "./ConfirmationDialog";

// based on https://dev.to/dmtrkovalenko/the-neatest-way-to-handle-alert-dialogs-in-react-1aoe

const ConfirmationServiceContext = React.createContext<
    (options: ConfirmationOptions) => Promise<[string, number?]>
>(Promise.reject);

export const useConfirmation = () =>
    React.useContext(ConfirmationServiceContext);

export const ConfirmationServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [
        confirmationState,
        setConfirmationState
    ] = React.useState<ConfirmationOptions | null>(null);

    const awaitingPromiseRef = React.useRef<{
        resolve: (r:[string, number?]) => void;
        reject: () => void;
    }>();

    const openConfirmation = (options: ConfirmationOptions) => {
        setConfirmationState(options);
        return new Promise<[string, number?]>((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject };
        });
    };

    // const handleClose = () => {
    //     if (confirmationState && confirmationState.catchOnCancel && awaitingPromiseRef.current) {
    //         awaitingPromiseRef.current.reject();
    //     }

    //     setConfirmationState(null);
    // };

    const handleSubmit = (choice: [string, number?])  => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(choice);
        }
        setConfirmationState(null);
    };

    return (
        <>
            <ConfirmationServiceContext.Provider
                value={openConfirmation}
                children={children}
            />
            {confirmationState ?
                <ConfirmationDialog
                    {...confirmationState as ConfirmationOptions}
                    onSubmit={handleSubmit}
                />
                : null}
        </>
    );
};
