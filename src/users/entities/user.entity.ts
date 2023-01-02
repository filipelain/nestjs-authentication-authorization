import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Role} from "../enums/role.enum";
import {Permission, PermissionType} from "../../iam/authorization/permission.type";
import {JoinTable} from "typeorm/browser";
import {ApiKey} from "../api-keys/entities/api-key.entity/api-key.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({unique: true})
    email: string;
    @Column()
    password: string

    @Column({enum: Role, default: Role.REGULAR})
    role: Role;

    // NOTE: Having the "permissions" column in combination with the "role"
    // likely does not make sense. We use both in this course just to showcase
    // two different approaches to authorization.
    @Column({enum: Permission, default: [], type: 'json'})
    permissions: PermissionType[];

    @JoinTable()
    @OneToMany(type => ApiKey, apiKey => apiKey.user)
    apiKeys: ApiKey[]
}
