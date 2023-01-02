import {Policy} from "../policies/interfaces/policy.interface";
import {SetMetadata} from "@nestjs/common";

export const POLICY_KEY = 'policies';
export const Policies = (...policies: Policy[]) => SetMetadata(POLICY_KEY, policies)