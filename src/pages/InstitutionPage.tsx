import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { institutionService } from '../services/institution.service';
import { employeeService } from '../services/employee.service';
import type { InstitutionResponse, CreateInstitutionRequest } from '../types/institution.types';
import type { GetEmployeeResponse } from '../types/employee.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/errorHandler';
import '../css/institution.css';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';

const emptyForm: CreateInstitutionRequest = {
    name: '',
    inn: '',
    phoneNumber: null,
    email: null,
    headId: null
};

const emptyHeadForm = {
    name: '',
    surname: '',
    patronymic: '' as string | null,
    phoneNumber: '' as string | null,
    email: '' as string | null
};

const formatEmployeeFio = (emp: { surname: string; name: string; patronymic?: string | null }) =>
    `${emp.surname} ${emp.name} ${emp.patronymic || ''}`.trim();

export const InstitutionsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [institutions, setInstitutions] = useState<InstitutionResponse[]>([]);
    const [employees, setEmployees] = useState<GetEmployeeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [modalMode, setModalMode] = useState<'none' | 'details' | 'form' | 'create-head' | 'delete'>('none');
    const [selectedInst, setSelectedInst] = useState<InstitutionResponse | null>(null);
    const [formData, setFormData] = useState<CreateInstitutionRequest>({ ...emptyForm });
    const [headForm, setHeadForm] = useState({ ...emptyHeadForm });
    const [isSaving, setIsSaving] = useState(false);

    const fetchInstitutions = async () => {
        setIsLoading(true);
        try {
            const res = await institutionService.getAll({ page, pageSize });
            setInstitutions(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при загрузке учреждений'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getAll({ page: 1, pageSize: 1000 });
            setEmployees(res.items);
        } catch (error) {
            console.error(getErrorMessage(error, 'Ошибка загрузки сотрудников'));
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, [page, pageSize]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleRowClick = (inst: InstitutionResponse) => {
        setSelectedInst(inst);
        setModalMode('details');
    };

    const handleCreateClick = () => {
        setSelectedInst(null);
        setFormData({ ...emptyForm });
        setModalMode('form');
    };

    const handleEditClick = () => {
        if (selectedInst) {
            setFormData({
                name: selectedInst.name,
                inn: selectedInst.inn,
                phoneNumber: selectedInst.phoneNumber ?? null,
                email: selectedInst.email ?? null,
                headId: selectedInst.headId ?? null
            });
            setModalMode('form');
        }
    };

    const openCreateHead = () => {
        setHeadForm({ ...emptyHeadForm });
        setModalMode('create-head');
    };

    const handleCreateHead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Сотрудника создаём без учреждений — привяжем после создания учреждения
            const employeeId = await employeeService.create({
                name: headForm.name,
                surname: headForm.surname,
                patronymic: headForm.patronymic || null,
                phoneNumber: headForm.phoneNumber || null,
                email: headForm.email || null,
                workplaces: []
            });

            const newEmployee: GetEmployeeResponse = {
                id: employeeId,
                name: headForm.name,
                surname: headForm.surname,
                patronymic: headForm.patronymic || null,
                phoneNumber: headForm.phoneNumber || null,
                email: headForm.email || null,
                isUser: false,
                workplaces: []
            };

            setEmployees(prev => [newEmployee, ...prev]);
            setFormData(prev => ({ ...prev, headId: employeeId }));
            toast.success('Руководитель создан. Завершите создание учреждения.');
            setModalMode('form');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при создании руководителя'));
        } finally {
            setIsSaving(false);
        }
    };

    const linkHeadToInstitution = async (employeeId: string, institutionId: string) => {
        const employee = employees.find(e => e.id === employeeId);
        const alreadyLinked = employee?.workplaces.some(w => w.institutionId === institutionId);

        if (alreadyLinked) return;

        const workplaces = [
            ...(employee?.workplaces.map(w => ({
                institutionId: w.institutionId,
                jobTitleId: w.jobTitleId ?? null
            })) || []),
            { institutionId, jobTitleId: null }
        ];

        await employeeService.update(employeeId, {
            name: employee?.name || headForm.name,
            surname: employee?.surname || headForm.surname,
            patronymic: employee?.patronymic ?? headForm.patronymic ?? null,
            phoneNumber: employee?.phoneNumber ?? headForm.phoneNumber ?? null,
            email: employee?.email ?? headForm.email ?? null,
            workplaces
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload: CreateInstitutionRequest = {
                name: formData.name,
                inn: formData.inn,
                phoneNumber: formData.phoneNumber || null,
                email: formData.email || null,
                headId: formData.headId || null
            };

            if (selectedInst) {
                await institutionService.update(selectedInst.id, payload);

                // При редактировании тоже привяжем главу к учреждению, если ещё не привязан
                if (payload.headId) {
                    try {
                        await linkHeadToInstitution(payload.headId, selectedInst.id);
                    } catch (linkError) {
                        console.error(getErrorMessage(linkError, 'Не удалось привязать руководителя к учреждению'));
                    }
                }

                toast.success('Учреждение успешно обновлено!');
            } else {
                const created = await institutionService.create(payload);

                // После создания учреждения привязываем руководителя (EmployeeInstitutions)
                if (payload.headId && created.id) {
                    try {
                        await linkHeadToInstitution(payload.headId, created.id);
                    } catch (linkError) {
                        console.error(getErrorMessage(linkError, 'Не удалось привязать руководителя к учреждению'));
                        toast.error('Учреждение создано, но не удалось привязать руководителя к списку сотрудников. Привяжите вручную.');
                        setModalMode('none');
                        fetchInstitutions();
                        fetchEmployees();
                        return;
                    }
                }

                toast.success('Учреждение успешно добавлено!');
            }
            setModalMode('none');
            fetchInstitutions();
            fetchEmployees();
        } catch (error: any) {
            if (error?.response?.status === 403) {
                toast.error('У вас нет прав для выполнения этого действия');
            } else {
                toast.error(getErrorMessage(error, 'Произошла ошибка при сохранении'));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setModalMode('delete');
    };

    const confirmDelete = async () => {
        if (!selectedInst) return;

        try {
            await institutionService.delete(selectedInst.id);
            toast.success('Учреждение успешно удалено');
            setModalMode('none');
            fetchInstitutions();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при удалении учреждения'));
        }
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString(), pageSize: pageSize.toString() });
    };

    const formatHead = (inst: InstitutionResponse) => {
        const fio = `${inst.headSurname || ''} ${inst.headName || ''} ${inst.headPatronymic || ''}`.trim();
        return fio || '-';
    };

    const columns: ColumnDef<InstitutionResponse>[] = [
        { header: 'Наименование', key: 'name' },
        { header: 'ИНН', key: 'inn' },
        {
            header: 'Руководитель',
            renderCell: (inst) => formatHead(inst)
        },
        {
            header: 'Телефон',
            renderCell: (inst) => inst.phoneNumber || <span className="text-muted">-</span>
        }
    ];

    return (
        <div className="content-body">
            <PageHeader
                title="Учреждения"
                actionLabel="Добавить учреждение"
                onAction={handleCreateClick}
            />

            <div className="data-card">
                <TableToolbar
                    searchPlaceholder="Поиск учреждений..."
                    filters={
                        <button className="filter-btn">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            Фильтры
                        </button>
                    }
                />

                <DataTable<InstitutionResponse>
                    columns={columns}
                    data={institutions}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                />

                <div className="pagination">
                    <button className="action-btn-secondary" disabled={!hasPrev}
                            onClick={() => handlePageChange(page - 1)}>
                        Назад
                    </button>
                    <span className="pagination-info">
                        Страница {page} из {totalPages === 0 ? 1 : totalPages}
                    </span>
                    <button className="action-btn-secondary" disabled={!hasNext}
                            onClick={() => handlePageChange(page + 1)}>
                        Вперед
                    </button>
                </div>
            </div>

            {modalMode !== 'none' && (
                <>
                    <div className="modal-backdrop" onClick={() => setModalMode('none')}/>
                    <div className="modal-panel">
                        <button className="close-btn" onClick={() => setModalMode('none')}>✕</button>

                        {modalMode === 'details' && selectedInst && (
                            <div className="modal-details">
                                <h3>{selectedInst.name}</h3>
                                <p><strong>ИНН:</strong> {selectedInst.inn}</p>
                                <p><strong>Телефон:</strong> {selectedInst.phoneNumber || '-'}</p>
                                <p><strong>Email:</strong> {selectedInst.email || '-'}</p>
                                <p><strong>Руководитель:</strong> {formatHead(selectedInst)}</p>

                                <div className="modal-actions">
                                    <button className="action-btn-secondary" onClick={handleEditClick}>Редактировать</button>
                                    <button className="action-btn-danger" onClick={handleDeleteClick}>Удалить</button>
                                </div>
                            </div>
                        )}
                        {modalMode === 'delete' && selectedInst && (
                            <div className="modal-details">
                                <h3 className="modal-header-danger">Удаление учреждения</h3>
                                <p>Вы действительно хотите удалить <strong>{selectedInst.name}</strong>?</p>
                                <p className="modal-warning-text">Это действие необратимо.</p>

                                <div className="modal-actions">
                                    <button className="action-btn-danger" onClick={confirmDelete}>
                                        Да, удалить
                                    </button>
                                    <button className="action-btn-secondary" onClick={() => setModalMode('details')}>
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'form' && (
                            <form onSubmit={handleSave} className="modal-form">
                                <h3>{selectedInst ? 'Редактирование' : 'Новое учреждение'}</h3>

                                <div className="form-group">
                                    <label>Наименование *</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>ИНН *</label>
                                    <input required pattern="\d{10}|\d{12}" title="10 или 12 цифр" value={formData.inn} onChange={e => setFormData({ ...formData, inn: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Телефон</label>
                                    <input type="tel" value={formData.phoneNumber || ''} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value || null })} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value || null })} />
                                </div>

                                <div className="form-group">
                                    <label>Руководитель</label>
                                    <select
                                        className="form-select"
                                        value={formData.headId || ''}
                                        onChange={e => setFormData({ ...formData, headId: e.target.value || null })}
                                    >
                                        <option value="">-- Без руководителя --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {formatEmployeeFio(emp)}
                                                {emp.email ? ` (${emp.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="action-btn-secondary"
                                        onClick={openCreateHead}
                                        style={{ marginTop: '8px', width: 'fit-content' }}
                                    >
                                        + Создать нового руководителя
                                    </button>
                                </div>

                                <button type="submit" className="action-btn-primary modal-submit-btn" disabled={isSaving}>
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </form>
                        )}

                        {modalMode === 'create-head' && (
                            <form onSubmit={handleCreateHead} className="modal-form">
                                <h3>Новый руководитель</h3>
                                <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    Сотрудник будет создан сейчас, а после сохранения учреждения автоматически привяжется к нему.
                                </p>

                                <div className="form-group">
                                    <label>Фамилия *</label>
                                    <input required value={headForm.surname} onChange={e => setHeadForm({ ...headForm, surname: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Имя *</label>
                                    <input required value={headForm.name} onChange={e => setHeadForm({ ...headForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Отчество</label>
                                    <input value={headForm.patronymic || ''} onChange={e => setHeadForm({ ...headForm, patronymic: e.target.value || null })} />
                                </div>
                                <div className="form-group">
                                    <label>Телефон</label>
                                    <input type="tel" value={headForm.phoneNumber || ''} onChange={e => setHeadForm({ ...headForm, phoneNumber: e.target.value || null })} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={headForm.email || ''} onChange={e => setHeadForm({ ...headForm, email: e.target.value || null })} />
                                </div>

                                <div className="modal-actions" style={{ marginTop: '8px' }}>
                                    <button type="submit" className="action-btn-primary" disabled={isSaving}>
                                        {isSaving ? 'Создание...' : 'Создать и вернуться'}
                                    </button>
                                    <button type="button" className="action-btn-secondary" onClick={() => setModalMode('form')}>
                                        Назад
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
