import React, { useState, useEffect } from 'react'; 
import { Box, Typography, Paper, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EmployeeTable from '../components/Table/EmployeeTable';
import EditModal from '../components/Table/EditModal';
import CreateEmployeeModal from '../components/Table/CreateEmployeeModal';
import UploadExcelModal from '../components/Table/UploadExcelModal';
import { TableData, Column } from '../components/Table/types';
import axiosInstance, { updateUser, createUser, uploadExcelFile, fetchDepartments, fetchPositions, fetchQRCodeList } from '../../utils/libs/axios';
import { useTranslation } from 'react-i18next';

export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  name: string;
  department_id: number;
  department: string;
}

const EmployeeListPage: React.FC = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<TableData | null>(null);
  const [employeeData, setEmployeeData] = useState<TableData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const { t } = useTranslation('admin');
  const [userCreated, setUserCreated] = useState(false);

  const columns: Column[] = [
    { id: 'employee_id', label: t('employeeTable.employeeId') },
    { id: 'full_name', label: t('employeeTable.fullName') },
    { id: 'department', label: t('employeeTable.department') },
    { id: 'position', label: t('employeeTable.position') },
    { id: 'phone', label: t('employeeTable.phone') },
    { id: 'email', label: t('employeeTable.email') },
    { id: 'action', label: t('employeeTable.action') },
  ];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetchDepartments();
  
        if (response) {
          // Проверяем наличие данных перед их использованием
          const { departments, nextDisplayNumber } = response;
  
          // Если departments и nextDisplayNumber существуют, устанавливаем их
          if (departments && nextDisplayNumber !== undefined) {
            setDepartments(departments);
            // Здесь добавь логику для использования nextDisplayNumber
          }
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
  
    const loadPositions = async () => {
      try {
        const response = await fetchPositions();
        setPositions(response); 
      } catch (error) {
        console.error("Failed to fetch positions", error);
      }
    };
  
    loadDepartments();
    loadPositions();
  }, []);
  

  const handleEditOpen = (employee: TableData) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleEditSave = async (updatedEmployee: TableData) => {
    try {
      await updateUser(
        updatedEmployee.id,
        updatedEmployee.password!,
        updatedEmployee.role!,
        updatedEmployee.full_name,
        updatedEmployee.department_id!,
        updatedEmployee.position_id!,
        updatedEmployee.phone!,
        updatedEmployee.email!
      );
      setUserCreated(prev => !prev);
      setEditModalOpen(false);
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  };

  const handleCreateSave = (newEmployee: TableData) => {
    setEmployeeData(prevData => [...prevData, newEmployee]);
    setCreateModalOpen(false);
    setUserCreated(prev => !prev);
  };
  

  const handleDelete = async (id: number) => {
    try {
      await axiosInstance().delete(`/user/${id}`);
    } catch (error) {
      console.error('Ошибка при удалении сотрудника:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // const response = await uploadExcelFile(formData);

      console.log('Файл успешно загружен:');
      setUploadModalOpen(false);
      setUserCreated(prev => !prev);
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
    }
  };

  const handleDownloadQRCodes = async () => {
    try {
      const response = await fetchQRCodeList();
  
      // Проверяем, является ли ответ валидным Blob
      if (!(response instanceof Blob)) {
        throw new Error('Неверный формат ответа');
      }
  
      // Создаем новый Blob с правильным MIME-типом
      const pdfBlob = new Blob([response], { type: 'application/pdf' });
  
      // Создаем временный URL для Blob
      const url = window.URL.createObjectURL(pdfBlob);
  
      // Создаем временный элемент ссылки
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qrcodes.pdf');
      
      // Добавляем в документ, кликаем и удаляем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Освобождаем URL для очистки памяти
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при загрузке QR-кодов:", error);
      alert("Не удалось загрузить QR-коды. Пожалуйста, попробуйте еще раз.");
    }
  };

  const handleExportEmployees = async () => {
    try {
      const response = await axiosInstance().get('/user/export_employee', {
        responseType: 'blob', // Ожидаем, что сервер вернет файл в виде Blob
      });
  
      if (!(response.data instanceof Blob)) {
        throw new Error('Неверный формат ответа');
      }
  
      // Изменяем MIME-тип на Excel
      const excelBlob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(excelBlob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees.xlsx'); // Изменили имя файла на .xlsx
  
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте сотрудников:", error);
      alert("Не удалось экспортировать сотрудников. Попробуйте еще раз.");
    }
  };
  
  

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{t('employeeList.pageTitle')}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ bgcolor: '#00D891', '&:hover': { bgcolor: '#00AB73' } }}
          >
            {t('employeeList.createButton')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadModalOpen(true)}
            sx={{ bgcolor: '#00D891', '&:hover': { bgcolor: '#00AB73' }, ml: 2 }}
          >
            {t('employeeList.uploadButton')}
          </Button>
        </Box>
        <Box>
          <Button
            variant="contained"
            onClick={handleDownloadQRCodes}
            sx={{ bgcolor: '#00D891', '&:hover': { bgcolor: '#00AB73' }, mr: 2 }}
          >
            {t('employeeList.downloadQRCodesButton')}
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportEmployees}
            sx={{ bgcolor: '#00D891', '&:hover': { bgcolor: '#00AB73' } }}
          >
            {t('Export')}
          </Button>
        </Box>
      </Box>
      <EmployeeTable
        departments={departments}
        positions={positions}
        columns={columns}
        onEdit={handleEditOpen}
        onDelete={handleDelete}
        tableTitle={t('employeeTable.title')}
        showCalendar={false}
        userCreated={userCreated}
      />
      <EditModal
        departments={departments}
        positions={positions}
        open={editModalOpen}
        data={selectedEmployee}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        userCreated={userCreated}
      />
      <CreateEmployeeModal
        departments={departments}
        positions={positions}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateSave}
      />
      <UploadExcelModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleFileUpload}
      />
    </Box>
  );
  };  

export default EmployeeListPage;