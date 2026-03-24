export declare const StorageItems: {
    ACCESS_TOKEN: string;
    REFRESH_TOKEN: string;
    CURRENT_USER: string;
};
export interface Token {
    accessToken?: string;
    refreshToken?: string;
}
export declare const tokenUtil: {
    save(value: Token): void;
    get(): Token;
    remove(): void;
};
//# sourceMappingURL=token.d.ts.map