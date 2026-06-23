import axios from 'axios';

export const getErrorMessage = (error: unknown, fallbackMessage: string = 'Произошла неизвестная ошибка'): string => {
    if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;

        return data.error || fallbackMessage;
    }

    // Если это сетевая ошибка (выключен интернет, упал сам сервер)
    if (error instanceof Error) {
        return error.message;
    }

    // Во всех остальных непонятных ситуациях
    return fallbackMessage;
};