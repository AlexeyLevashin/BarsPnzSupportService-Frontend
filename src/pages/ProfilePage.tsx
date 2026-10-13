import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui/PageHeader';
import { PasswordResetForm } from '../components/PasswordResetForm';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { institutionService } from '../services/institution.service';
import { jobTitleService } from '../services/jobTitle.service';
import { getErrorMessage } from '../lib/errorHandler';
import { UserRole, type CreateUserWithEmployeeRequest, type GetUserResponse, type UpdateUserPasswordRequest } from '../types/user.types';
import type { InstitutionResponse } from '../types/institution.types';
import type { GetJobTitleResponse } from '../types/jobTitle.types';
import '../css/profile.css';

const roleNames: Record<UserRole, string> = {
    User: 'Пользователь', UserAdmin: 'Администратор учреждения', Operator: 'Оператор', SuperAdmin: 'Супер-администратор'
};

const toForm = (user: GetUserResponse): CreateUserWithEmployeeRequest => ({
    name: user.name ?? '', surname: user.surname ?? '', patronymic: user.patronymic ?? '',
    email: user.email, phoneNumber: user.phoneNumber ?? '', role: user.role,
    workplaces: user.workplaces.map(w => ({ institutionId: w.institutionId, jobTitleId: w.jobTitleId ?? null }))
});

const emptyPassword: UpdateUserPasswordRequest = { password: '', newPassword: '', confirmNewPassword: '' };

export const ProfilePage = () => {
    const [profile, setProfile] = useState<GetUserResponse | null>(null);
    const [form, setForm] = useState<CreateUserWithEmployeeRequest | null>(null);
    const [institutions, setInstitutions] = useState<InstitutionResponse[]>([]);
    const [jobTitles, setJobTitles] = useState<GetJobTitleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [password, setPassword] = useState(emptyPassword);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);
    const canEditWorkplaces = profile?.role !== UserRole.User;
    const canEditRole = profile?.role === UserRole.Operator || profile?.role === UserRole.SuperAdmin;

    const loadProfile = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const user = await userService.getMe();
            setProfile(user);
            setForm(toForm(user));
            if (user.role !== UserRole.User) {
                const [titles, organizations] = await Promise.all([
                    jobTitleService.getAll(),
                    user.role === UserRole.UserAdmin ? institutionService.getMy() : (async () => {
                        const items: InstitutionResponse[] = [];
                        let page = 1;
                        let hasNext = true;
                        while (hasNext) {
                            const result = await institutionService.getAll({ page, pageSize: 50 });
                            items.push(...result.items);
                            hasNext = result.pageInfo.hasNextPage;
                            page++;
                        }
                        return items;
                    })()
                ]);
                setJobTitles(titles);
                setInstitutions(organizations);
            }
        } catch (error) {
            setLoadError(getErrorMessage(error, 'Не удалось загрузить профиль'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadProfile(); }, []);

    const saveProfile = async (event: FormEvent) => {
        event.preventDefault();
        if (!profile || !form) return;
        if ((form.role === UserRole.User || form.role === UserRole.UserAdmin) && !form.workplaces.length &&
            !(profile.role === UserRole.User && !profile.workplaces.length)) {
            toast.error('Укажите хотя бы одно учреждение');
            return;
        }
        if (form.workplaces.some(w => !w.institutionId)) {
            toast.error('Выберите учреждение для каждого места работы');
            return;
        }
        setSaving(true);
        try {
            const saved = await userService.update(profile.id, {
                ...form, name: form.name.trim(), surname: form.surname.trim(), email: form.email.trim(),
                patronymic: form.patronymic?.trim() || null, phoneNumber: form.phoneNumber?.trim() || null
            });
            setProfile(saved);
            setForm(toForm(saved));
            await authService.refreshToken();
            toast.success('Профиль сохранён');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось сохранить профиль'));
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (event: FormEvent) => {
        event.preventDefault();
        if (password.newPassword !== password.confirmNewPassword) {
            toast.error('Пароли не совпадают');
            return;
        }
        setChangingPassword(true);
        try {
            await userService.updatePassword(password);
            setPassword(emptyPassword);
            toast.success('Пароль изменён');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось изменить пароль'));
        } finally {
            setChangingPassword(false);
        }
    };

    const updateWorkplace = (index: number, key: 'institutionId' | 'jobTitleId', value: string) => {
        if (!form) return;
        setForm({ ...form, workplaces: form.workplaces.map((w, i) => i === index ? { ...w, [key]: value || null } : w) });
    };

    return (
        <div className="content-body profile-page">
            <PageHeader title="Мой профиль" />
            {loading ? <p role="status">Загрузка профиля...</p> : loadError ? (
                <div className="profile-card"><p role="alert" className="profile-error">{loadError}</p>
                    <button type="button" className="action-btn-secondary" onClick={() => void loadProfile()}>Повторить загрузку</button></div>
            ) : profile && form && (
                <div className="profile-layout">
                    <section className="data-card profile-card">
                        <h3>Личные данные</h3>
                        <p className="profile-hint">{roleNames[profile.role]}</p>
                        <form onSubmit={saveProfile}>
                            <fieldset disabled={saving} className="profile-fieldset">
                                <div className="profile-fields">
                                    <label>Фамилия<input required value={form.surname} autoComplete="family-name" onChange={e => setForm({ ...form, surname: e.target.value })} /></label>
                                    <label>Имя<input required value={form.name} autoComplete="given-name" onChange={e => setForm({ ...form, name: e.target.value })} /></label>
                                    <label>Отчество<input value={form.patronymic ?? ''} autoComplete="additional-name" onChange={e => setForm({ ...form, patronymic: e.target.value })} /></label>
                                    <label>Телефон<input type="tel" value={form.phoneNumber ?? ''} autoComplete="tel" onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></label>
                                    <label className="profile-wide">Email<input type="email" required value={form.email} autoComplete="email" onChange={e => setForm({ ...form, email: e.target.value })} /></label>
                                    {canEditRole && <label className="profile-wide">Роль<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                                        {Object.values(UserRole).filter(role => profile.role === UserRole.SuperAdmin || role !== UserRole.SuperAdmin).map(role => <option key={role} value={role}>{roleNames[role]}</option>)}
                                    </select></label>}
                                </div>
                                <h4>Места работы</h4>
                                {canEditWorkplaces ? <>
                                    {form.workplaces.map((workplace, index) => (
                                        <div className="profile-workplace" key={index}>
                                            <label>Учреждение<select required value={workplace.institutionId} onChange={e => updateWorkplace(index, 'institutionId', e.target.value)}>
                                                <option value="">Выберите учреждение</option>
                                                {institutions.filter(i => i.id === workplace.institutionId || !form.workplaces.some(w => w.institutionId === i.id)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select></label>
                                            <label>Должность<select value={workplace.jobTitleId ?? ''} onChange={e => updateWorkplace(index, 'jobTitleId', e.target.value)}>
                                                <option value="">Не указана</option>
                                                {jobTitles.map(title => <option key={title.id} value={title.id}>{title.name}</option>)}
                                            </select></label>
                                            <button type="button" className="action-btn-secondary" aria-label={`Удалить место работы ${index + 1}`} onClick={() => setForm({ ...form, workplaces: form.workplaces.filter((_, i) => i !== index) })}>Удалить</button>
                                        </div>
                                    ))}
                                    <button type="button" className="action-btn-secondary" disabled={form.workplaces.length >= institutions.length} onClick={() => setForm({ ...form, workplaces: [...form.workplaces, { institutionId: '', jobTitleId: null }] })}>Добавить место работы</button>
                                </> : <>
                                    {profile.workplaces.length ? <ul className="profile-workplaces">{profile.workplaces.map(w => <li key={w.institutionId}><strong>{w.institutionName}</strong><span>{w.jobTitleName || 'Должность не указана'}</span></li>)}</ul> : <p className="profile-hint">Места работы не указаны</p>}
                                    <p className="profile-hint">Для изменения места работы обратитесь к администратору.</p>
                                </>}
                                <div className="profile-actions">
                                    <button className="action-btn-primary" type="submit">{saving ? 'Сохранение...' : 'Сохранить изменения'}</button>
                                    <button className="action-btn-secondary" type="button" onClick={() => setForm(toForm(profile))}>Отменить изменения</button>
                                </div>
                            </fieldset>
                        </form>
                    </section>
                    <section className="data-card profile-card">
                        <h3>Смена пароля</h3>
                        <form onSubmit={changePassword}>
                            <fieldset className="profile-fieldset" disabled={changingPassword}>
                                <label>Текущий пароль<input required type="password" autoComplete="current-password" value={password.password} onChange={e => setPassword({ ...password, password: e.target.value })} /></label>
                                <label>Новый пароль<input required minLength={6} type="password" autoComplete="new-password" value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })} /></label>
                                <label>Подтвердите новый пароль<input required minLength={6} type="password" autoComplete="new-password" value={password.confirmNewPassword} onChange={e => setPassword({ ...password, confirmNewPassword: e.target.value })} /></label>
                                <button type="submit" className="action-btn-primary">{changingPassword ? 'Сохранение...' : 'Изменить пароль'}</button>
                            </fieldset>
                        </form>
                        <div className="profile-recovery">
                            <button type="button" className="action-btn-secondary" onClick={() => setShowRecovery(!showRecovery)}>{showRecovery ? 'Скрыть восстановление' : 'Не помню текущий пароль'}</button>
                            {showRecovery && <PasswordResetForm initialEmail={profile.email} />}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};
