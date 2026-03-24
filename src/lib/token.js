import Cookies from 'js-cookie';
export const StorageItems = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    CURRENT_USER: 'current_user'
};
export const tokenUtil = {
    save(value) {
        if (value.accessToken)
            Cookies.set(StorageItems.ACCESS_TOKEN, value.accessToken);
        if (value.refreshToken)
            Cookies.set(StorageItems.REFRESH_TOKEN, value.refreshToken);
    },
    get() {
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
//# sourceMappingURL=token.js.map