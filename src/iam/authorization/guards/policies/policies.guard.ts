import {CanActivate, ExecutionContext, ForbiddenException, Injectable, Type} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {PermissionType} from "../../permission.type";
import {ActiveUserData} from "../../../interfaces/active-user-data.interface";
import {REQUEST_USER_KEY} from "../../../authentication/guards/access-token/iam.constants";
import {POLICY_KEY} from "../../decorators/policy.decorator";
import {PolicyHandlersStorage} from "../../policies/policy-handlers.storage";

@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector,
                private readonly policyHandlersStorage: PolicyHandlersStorage) {
    }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean>{
        const policies = this.reflector.getAllAndOverride<PermissionType[]>(POLICY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!policies) return true;

        const user: ActiveUserData = context.switchToHttp().getRequest()[REQUEST_USER_KEY]

        await Promise.all(policies.map(policy => {
            const policyHandler = this.policyHandlersStorage.get(policy.constructor as Type)
            return policyHandler.handle(policy, user)
        })).catch(err => {
            throw new ForbiddenException(err.message)
        });

        return true;
    }
}
