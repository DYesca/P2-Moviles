<template>
    <ion-page>
        <ion-header :translucent="true">
            <ion-toolbar>
                <ion-title>Tareas del Proyecto</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <!-- Botón para agregar nueva tarea -->
            <ion-button expand="block" @click="openNewTaskModal">Añadir Tarea</ion-button>

            <!-- Lista de tareas -->
            <ion-list>
                <ion-item v-if="tasks.length === 0">
                    <ion-label>No hay tareas disponibles.</ion-label>
                </ion-item>
                <ion-item v-for="task in tasks" :key="task.id" button @click="editTask(task)">
                    <ion-label>
                        <h2>{{ task.name}}</h2>
                        <p>{{ task.description }}</p>
                        <p><strong>Status:</strong> {{ task.status }}</p>
                    </ion-label>
                    <!-- Botón para eliminar tarea -->
                    <ion-button fill="clear" color="danger" slot="end"
                        @click.stop="confirmDeleteTask(task)">Eliminar</ion-button>
                </ion-item>
            </ion-list>

            <!-- Botón para volver a la lista de proyectos -->
            <ion-button expand="block" color="medium" router-link="/tabs">Volver a Proyectos</ion-button>

            <!-- Modal para Nueva/Edición de Tarea -->
            <ion-modal :is-open="showTaskModal" @didDismiss="closeTaskModal">
                <ion-header>
                    <ion-toolbar>
                        <ion-title>{{ editingTask ? 'Editar Tarea' : 'Nueva Tarea' }}</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="closeTaskModal">Cancelar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="ion-padding">
                    <ion-item>
                        <ion-label position="stacked">Nombre</ion-label>
                        <ion-input v-model="taskForm.name" placeholder="Nombre de la tarea"></ion-input>
                    </ion-item>
                    <ion-item>
                        <ion-label position="stacked">Descripción</ion-label>
                        <ion-textarea v-model="taskForm.description"
                            placeholder="Descripción de la tarea"></ion-textarea>
                    </ion-item>
                    <ion-item>
                        <ion-label position="stacked">Estado</ion-label>
                        <ion-select v-model="taskForm.status">
                            <ion-select-option value="pending">Sin empezar</ion-select-option>
                            <ion-select-option value="in-progress">En progreso</ion-select-option>
                            <ion-select-option value="completed">Completado</ion-select-option>
                        </ion-select>
                    </ion-item>
                    <ion-button expand="block" @click="saveTask" class="ion-margin-top">
                        {{ editingTask ? 'Actualizar' : 'Crear' }} Tarea
                    </ion-button>
                </ion-content>
            </ion-modal>
            <!-- Alert para confirmar eliminación -->
            <ion-alert :is-open="showDeleteAlert" header="Confirmar eliminación"
                message="¿Estás seguro de eliminar esta tarea?" :buttons="deleteAlertButtons"></ion-alert>

            <!-- Alert para notificaciones -->
            <ion-alert :is-open="showNotification" :header="notificationHeader" :message="notificationMessage"
                :buttons="['OK']" @didDismiss="showNotification = false"></ion-alert>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Preferences } from '@capacitor/preferences';
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel,
    IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonAlert, IonButtons
} from '@ionic/vue';

// Recuperar el projectId de la ruta
const route = useRoute();
const projectId = route.params.id;

// Variables reactivas
interface Task {
    id: number;
    name: string;
    description: string;
    status: string;
}

const tasks = ref<Task[]>([]); // Lista de tareas
const token = ref('');
const showTaskModal = ref(false);
const editingTask = ref<any>(null); // Tarea en edición, nulo si se crea una nueva
const taskForm = ref({
    name: '',
    description: '',
    status: 'pending',
});

// Variables para eliminar tareas
const showDeleteAlert = ref(false);
const taskToDelete = ref<any>(null);
const deleteAlertButtons = ref<any>([]);

// Variables para notificaciones
const showNotification = ref(false);
const notificationHeader = ref('');
const notificationMessage = ref('');

// Función para mostrar notificaciones con IonAlert
function notify(header: string, message: string) {
    notificationHeader.value = header;
    notificationMessage.value = message;
    showNotification.value = true;
}

// Obtener el token y las tareas al montar el componente
onMounted(async () => {
    const { value: storedToken } = await Preferences.get({ key: 'user_token' });
    token.value = storedToken || '';
    await fetchTasks();
});

// Función para obtener las tareas desde el API
async function fetchTasks() {
    try {
        const response = await fetch(`https://po02projectmanagerapi-production.up.railway.app/api/task/list/${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (response.ok) {
            // Asumimos que la respuesta es un array de tareas
            tasks.value = data;
        } else {
            console.error('Error al obtener tareas:', data.message || data);
            notify('Error', 'No se pudieron cargar las tareas');
        }
    } catch (error) {
        console.error('Error en fetchTasks:', error);
        notify('Error', 'No se pudieron cargar las tareas');
    }
}

// Abrir modal para crear una nueva tarea
function openNewTaskModal() {
    editingTask.value = null;
    taskForm.value = { name: '', description: '', status: 'pending' };
    showTaskModal.value = true;
}

// Cerrar modal de tarea
function closeTaskModal() {
    showTaskModal.value = false;
}

// Abrir modal para editar tarea, precargando los datos
function editTask(task: any) {
    editingTask.value = task;
    taskForm.value = {
        name: task.name,
        description: task.description,
        status: task.status // Asegúrate de que el valor sea compatible (pending, in-progress, completed)
    };
    showTaskModal.value = true;
}

// Guardar tarea (crear nueva o actualizar existente)
async function saveTask() {
    if (editingTask.value) {
        // Actualizar tarea: PUT /task/update
        try {
            const response = await fetch(`https://po02projectmanagerapi-production.up.railway.app/api/task/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.value}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingTask.value.id,
                    name: taskForm.value.name,
                    description: taskForm.value.description,
                    project_id: projectId,
                    user_id: editingTask.value.user_id, // Puedes cambiarlo si es necesario
                    status: taskForm.value.status,
                })
            });
            const data = await response.json();
            if (response.ok) {
                notify('Tarea Actualizada', 'La tarea se actualizó correctamente');
                await fetchTasks();
            } else {
                notify('Error', data.message || 'Error al actualizar la tarea');
            }
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            notify('Error', 'Error al actualizar la tarea');
        }
    } else {
        // Crear nueva tarea: POST /task/store
        try {
            const response = await fetch(`https://po02projectmanagerapi-production.up.railway.app/api/task/store`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.value}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: taskForm.value.name,
                    description: taskForm.value.description,
                    project_id: projectId,
                    user_id: 1, // Reemplaza por el id real del usuario actual
                    status: taskForm.value.status,
                })
            });
            const data = await response.json();
            if (response.ok) {
                notify('Tarea Creada', 'La tarea se creó correctamente');
                await fetchTasks();
            } else {
                notify('Error', data.message || 'Error al crear la tarea');
            }
        } catch (error) {
            console.error('Error al crear tarea:', error);
            notify('Error', 'Error al crear la tarea');
        }
    }
    showTaskModal.value = false;
}

// Confirmar eliminación de tarea con un Alert
function confirmDeleteTask(task: any) {
    taskToDelete.value = task;
    deleteAlertButtons.value = [
        {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
                taskToDelete.value = null;
            },
        },
        {
            text: 'Eliminar',
            handler: () => {
                deleteTask(task.id);
            },
        },
    ];
    showDeleteAlert.value = true;
}

// Función para eliminar tarea: DELETE /task/destroy/{id}
async function deleteTask(id: number) {
    try {
        const response = await fetch(`https://po02projectmanagerapi-production.up.railway.app/api/task/destroy/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            notify('Eliminada', 'La tarea se eliminó correctamente');
            await fetchTasks();
        } else {
            const data = await response.json();
            notify('Error', data.message || 'Error al eliminar la tarea');
        }
    } catch (error) {
        console.error('Error en deleteTask:', error);
        notify('Error', 'Error al eliminar la tarea');
    }
}
</script>

<style scoped>
/* Ajusta estilos según tus necesidades */
ion-item {
    --min-height: 70px;
}
</style>