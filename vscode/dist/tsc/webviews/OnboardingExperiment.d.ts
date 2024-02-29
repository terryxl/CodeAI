/// <reference types="react" />
import type { TelemetryService } from '@sourcegraph/cody-shared';
import type { AuthMethod } from '../src/chat/protocol';
import type { VSCodeWrapper } from './utils/VSCodeApi';
interface LoginProps {
    simplifiedLoginRedirect: (method: AuthMethod) => void;
    telemetryService: TelemetryService;
    uiKindIsWeb: boolean;
    vscodeAPI: VSCodeWrapper;
}
export declare const LoginSimplified: React.FunctionComponent<React.PropsWithoutRef<LoginProps>>;
export {};
//# sourceMappingURL=OnboardingExperiment.d.ts.map