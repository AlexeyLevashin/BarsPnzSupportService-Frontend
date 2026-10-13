import axios from 'axios';

export const getErrorMessage = (error: unknown, fallbackMessage: string = 'Произошла неизвестная ошибка'): string => {
    if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;

        if (data.error) return data.error;
        if (data.errors) {
            const messages = Object.values(data.errors).flat();
            if (messages.length) return messages.join(' ');
        }
        return fallbackMessage;
    }

    if (axios.isAxiosError(error) && error.response?.status === 429) return 'Слишком много запросов. Попробуйте позже.';

    // Если это сетевая ошибка (выключен интернет, упал сам сервер)
    if (error instanceof Error) {
        return error.message;
    }

    // Во всех остальных непонятных ситуациях
    return fallbackMessage;
};