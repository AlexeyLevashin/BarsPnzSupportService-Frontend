import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { institutionService } from '../services/institution.service';
import type { InstitutionResponse, CreateInstitutionRequest } from '../types/institution.types';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../css/institution.css';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
export const InstitutionsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [institutions, setInstitutions] = useState<InstitutionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [modalMode, setModalMode] = useState<'none' | 'details' | 'form' | 'delete'>('none');
    const [selectedInst, setSelectedInst] = useState<InstitutionResponse | null>(null);
    const [formData, setFormData] = useState<CreateInstitutionRequest>({
        name: '', inn: '', headName: '', headSurname: '', headPatronymic: ''
    });

    const fetchInstitutions = async () => {
        setIsLoading(true);
        try {
            const res = await institutionService.getAll({ page, pageSize });
            setInstitutions(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, [page, pageSize]);

    const handleRowClick = (inst: InstitutionResponse) => {
        setSelectedInst(inst);
        setModalMode('details');
    };

    const handleCreateClick = () => {
        setSelectedInst(null);
        setFormData({ name: '', inn: '', headName: '', headSurname: '', headPatronymic: '' });
        setModalMode('form');
    };

    const handleEditClick = () => {
        if (selectedInst) {
            setFormData({
                name: selectedInst.name,
                inn: selectedInst.inn,
                headName: selectedInst.headName || '',
                headSurname: selectedInst.headSurname || '',
                headPatronymic: selectedInst.headPatronymic || ''
            });
            setModalMode('form');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedInst) {
                await institutionService.update(selectedInst.id, formData);
                toast.success('Учреждение успешно обновлено!');
            } else {
                await institutionService.create(formData);
                toast.success('Учреждение успешно добавлено!');
            }
            setModalMode('none');
            fetchInstitutions();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    toast.error('У вас нет прав для выполнения этого действия');
                }
                else if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                }
                else {
                    toast.error('Произошла ошибка при сохранении');
                }
            } else {
                console.error(error);
            }
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
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Ошибка при удалении учреждения');
            }
        }
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString(), pageSize: pageSize.toString() });
    };

    const columns: ColumnDef<InstitutionResponse>[] = [
        { header: 'Наименование', key: 'name' },
        { header: 'ИНН', key: 'inn' },
        {
            header: 'Руководитель',
            renderCell: (inst) => `${inst.headSurname || ''} ${inst.headName || ''} ${inst.headPatronymic || ''}`.trim()
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
                    <button className="action-btn-secondary" disabled={!hasPrev} onClick={() => handlePageChange(page - 1)}>
                        Назад
                    </button>
                    <span style={{ margin: '0 16px', display: 'flex', alignItems: 'center' }}>
                        Страница {page} из {totalPages === 0 ? 1 : totalPages}
                    </span>
                    <button className="action-btn-secondary" disabled={!hasNext} onClick={() => handlePageChange(page + 1)}>
                        Вперед
                    </button>
                </div>
            </div>

            {modalMode !== 'none' && (
                <>
                    <div className="modal-backdrop" onClick={() => setModalMode('none')} />
                    <div className="modal-panel">
                        <button className="close-btn" onClick={() => setModalMode('none')}>✕</button>

                        {modalMode === 'details' && selectedInst && (
                            <div className="modal-details">
                                <h3>{selectedInst.name}</h3>
                                <p><strong>ИНН:</strong> {selectedInst.inn}</p>
                                <p><strong>Руководитель:</strong> {selectedInst.headSurname} {selectedInst.headName} {selectedInst.headPatronymic}</p>

                                <div className="modal-actions">
                                    <button className="action-btn-secondary" onClick={handleEditClick}>Редактировать</button>
                                    <button className="action-btn-danger" onClick={handleDeleteClick}>Удалить</button>
                                </div>
                            </div>
                        )}
                        {modalMode === 'delete' && selectedInst && (
                            <div className="modal-details">
                                <h3 style={{ color: '#ef4444', borderBottomColor: '#fee2e2' }}>Удаление учреждения</h3>
                                <p>Вы действительно хотите удалить <strong>{selectedInst.name}</strong>?</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Это действие необратимо.</p>

                                <div className="modal-actions" style={{ marginTop: '24px' }}>
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
                                    <label>Фамилия руководителя</label>
                                    <input value={formData.headSurname || ''} onChange={e => setFormData({ ...formData, headSurname: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Имя руководителя</label>
                                    <input value={formData.headName || ''} onChange={e => setFormData({ ...formData, headName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Отчество руководителя</label>
                                    <input value={formData.headPatronymic || ''} onChange={e => setFormData({ ...formData, headPatronymic: e.target.value })} />
                                </div>

                                <button type="submit" className="action-btn-primary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                                    Сохранить
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};