import Cookies from 'js-cookie';

export const StorageItems = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    CURRENT_USER: 'current_user',
    TWO_FACTOR_TOKEN: 'two_factor_token'
};

export interface Token {
    accessToken?: string;
    refreshToken?: string;
}

export const twoFactorTokenUtil = {
    save(value: string) {
        sessionStorage.setItem(StorageItems.TWO_FACTOR_TOKEN, value);
    },
    get(): string {
        return sessionStorage.getItem(StorageItems.TWO_FACTOR_TOKEN) || '';
    },
    remove() {
        sessionStorage.removeItem(StorageItems.TWO_FACTOR_TOKEN);
    }
};

export const tokenUtil = {
    save(value: Token) {
        if (value.accessToken) Cookies.set(StorageItems.ACCESS_TOKEN, value.accessToken);
        if (value.refreshToken) Cookies.set(StorageItems.REFRESH_TOKEN, value.refreshToken);
        window.dispatchEvent(new Event('auth-tokens-changed'));
    },
    get(): Token {
        return {
            accessToken: Cookies.get(StorageItems.ACCESS_TOKEN) || '',
            refreshToken: Cookies.get(StorageItems.REFRESH_TOKEN) || ''
        };
    },
    remove() {
        Cookies.remove(StorageItems.ACCESS_TOKEN);
        Cookies.remove(StorageItems.REFRESH_TOKEN);
    }
};