import { useEffect } from 'react';
import '../css/validation.css';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const messageFor = (field: Field) => {
    if (field.validity.valueMissing) return 'Заполните это поле';
    if (field.validity.typeMismatch && field.type === 'email') return 'Введите корректный адрес электронной почты';
    if (field.validity.patternMismatch) return field.title || 'Проверьте формат значения';
    if (field.validity.tooShort && !(field instanceof HTMLSelectElement)) return `Минимум ${field.minLength} символов`;
    if (field.validity.tooLong && !(field instanceof HTMLSelectElement)) return `Максимум ${field.maxLength} символов`;
    return 'Проверьте значение поля';
};

export const ValidationMessages = () => {
    useEffect(() => {
        const clear = (field: Field) => {
            const container = field.parentElement;
            if (!container) return;
            delete container.dataset.fieldError;
            field.removeAttribute('aria-invalid');
        };

        const onInvalid = (event: Event) => {
            const field = event.target;
            if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
            event.preventDefault();
            if (!field.parentElement) return;
            field.parentElement.dataset.fieldError = messageFor(field);
            field.setAttribute('aria-invalid', 'true');
        };

        const onEdit = (event: Event) => {
            const field = event.target;
            if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
                if (field.validity.valid) clear(field);
                else if (field.parentElement?.dataset.fieldError) field.parentElement.dataset.fieldError = messageFor(field);
            }
        };

        document.addEventListener('invalid', onInvalid, true);
        document.addEventListener('input', onEdit, true);
        document.addEventListener('change', onEdit, true);
        return () => {
            document.removeEventListener('invalid', onInvalid, true);
            document.removeEventListener('input', onEdit, true);
            document.removeEventListener('change', onEdit, true);
        };
    }, []);

    return null;
};
