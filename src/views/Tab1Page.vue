<template>
    <ion-page>
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-title>Gestión de Proyectos</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <ion-list>
          <ion-item v-if="projects.length === 0">
            <ion-label>No hay proyectos disponibles.</ion-label>
          </ion-item>
          <ion-item v-for="project in projects" :key="project.id" button @click="goToProjectTasks(project.id)">
            <ion-label>
              <h2>{{ project.name }}</h2>
              <p>ID: {{ project.id }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
  
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  } from '@ionic/vue';
  
  import { ref, onMounted } from 'vue';
  import { Preferences } from '@capacitor/preferences';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const goToProjectTasks = (projectId: number) => {
    router.push(`/project/${projectId}/tasks`);
  };
  
  
  // Variable reactiva para los proyectos
  const projects = ref([]);
  
  // Función para obtener los proyectos
  const fetchProjects = async () => {
    const { value: token } = await Preferences.get({ key: 'user_token' });
  
    if (!token) {
      console.error('No token found');
      return;
    }
  
    try {
      const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/project/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      const data = await response.json();
      console.log('Respuesta completa del backend:', data);
  
  
      if (response.ok) {
        projects.value = data.projects || data; // depende del formato que devuelva el backend
        console.log('Proyectos obtenidos:', projects.value);
      } else {
        console.error('Error al obtener proyectos:', data.message || data);
      }
    } catch (error) {
      console.error('Error en fetchProjects:', error);
    }
  };
  
  // Llamar al cargar
  onMounted(() => {
    fetchProjects();
  });
  </script>
  