<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>¡Crea tu proyecto!</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <!-- Lista de proyectos -->
        <ion-list>
          <ion-item v-for="(project, index) in projects" :key="project.id">
            <ion-label>{{ project.name }}</ion-label>
  
            <!-- Botón para editar con modal -->
            <ion-button @click="showEditModal(project, index)" color="medium" fill="clear">
              Editar
            </ion-button>
  
            <!-- Botón para eliminar proyecto -->
            <ion-button @click="showDeleteAlert(index)" fill="solid" color="danger">
              Borrar
            </ion-button>
          </ion-item>
        </ion-list>
  
        <!-- Botón para agregar nuevo proyecto -->
        <ion-item lines="none">
          <ion-button @click="addNewProject" color="primary" expand="block">
            Agregar Proyecto
          </ion-button>
        </ion-item>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonLabel, IonButton,
    alertController
  } from '@ionic/vue';
  
  import { ref, onMounted } from 'vue';
  import { Preferences } from '@capacitor/preferences';
  
  const projects = ref<any[]>([]);
  const token = ref<string | null>(null);
  
  // Obtener token al iniciar
  const getToken = async () => {
    const result = await Preferences.get({ key: 'user_token' });
    token.value = result.value;
  };
  
  // Obtener proyectos
  const fetchProjects = async () => {
    if (!token.value) return;
  
    try {
      const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/project/list', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });
  
      if (!response.ok) throw new Error('Error al obtener proyectos');
      const data = await response.json();
      projects.value = data;
    } catch (error) {
      console.error(error);
    }
  };
  
  // Crear nuevo proyecto
  const addNewProject = async () => {
    const alert = await alertController.create({
      header: 'Nuevo Proyecto',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Nombre del Proyecto' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            try {
              const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/project/store', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token.value}`
                },
                body: JSON.stringify({ name: data.name })
              });
  
              if (!response.ok) throw new Error('Error al crear proyecto');
              const newProject = await response.json();
              projects.value.push(newProject);
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    });
  
    await alert.present();
  };
  
  // Editar proyecto con modal
  const showEditModal = async (project: any, index: number) => {
    const alert = await alertController.create({
      header: 'Editar Proyecto',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Nuevo nombre', value: project.name }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/project/update', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token.value}`
                },
                body: JSON.stringify({ name: data.name , id: project.id })

              });
  
              if (!response.ok) throw new Error('Error al editar proyecto');
              const updatedProject = await response.json();
              projects.value[index].name = updatedProject.name;
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    });
  
    await alert.present();
  };
  
  // Eliminar proyecto
  const showDeleteAlert = async (index: number) => {
    const alert = await alertController.create({
      header: 'Eliminar Proyecto',
      message: '¿Estás seguro de que deseas eliminar este proyecto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              const response = await fetch(`https://po02projectmanagerapi-production.up.railway.app/api/project/destroy/${projects.value[index].id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token.value}`
                }
              });
  
              if (!response.ok) throw new Error('Error al eliminar proyecto');
              projects.value.splice(index, 1);
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    });
  
    await alert.present();
  };
  
  // Al montar componente
  onMounted(async () => {
    await getToken();
    await fetchProjects();
  });
  </script>
  