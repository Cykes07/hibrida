import { ViewChild, ElementRef, Component, signal } from '@angular/core';
import {IonCardContent,IonButton,IonList,IonItem,IonLabel,IonFab,IonFabButton,IonIcon,IonCard,IonHeader,IonToolbar,IonTitle,IonContent,} from '@ionic/angular/standalone';
import { PercentPipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { cloudUploadOutline } from 'ionicons/icons';
import { TeachablemachineService } from '../services/teachablemachine.service';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tab1',
  standalone: true,
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule,PercentPipe,IonCardContent,IonButton,IonList,IonItem,IonLabel,IonFab,IonFabButton,IonIcon,IonCard,IonHeader,IonToolbar,IonTitle,IonContent,],
})
export class Tab1Page {
  // Propiedades para la predicción y mensajes
  predictionMessage: string = '';
  recommendationLink: string = '';
  isJorobado: boolean = false;
  showMessage: boolean = false;

  // Estado de la imagen
  imageReady = signal(false);
  imageUrl = signal('');

  // Modelo y predicciones
  modelLoaded = signal(false);
  classLabels: string[] = [];
  predictions: any[] = [];

  // Referencias al DOM
  @ViewChild('image', { static: false }) imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('resultChart', { static: false }) resultChart!: ElementRef;

  chart: any;

  constructor(private teachablemachine: TeachablemachineService) {
    addIcons({ cloudUploadOutline });
  }

  /* Método para manejar la carga de imágenes */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imageUrl.set(reader.result as string);
        this.imageReady.set(true);
      };
      reader.readAsDataURL(file);
    }
  }

  /* Método para cargar el modelo */
  async ngOnInit() {
    await this.teachablemachine.loadModel();
    this.classLabels = this.teachablemachine.getClassLabels();
    this.modelLoaded.set(true);
  }

  /* Método para predecir la postura */
  async predict() {
    try {
      const image = this.imageElement.nativeElement;
      this.predictions = await this.teachablemachine.predict(image);

      const labels = this.predictions.map((prediction) => prediction.className);
      const probabilities = this.predictions.map((prediction) => prediction.probability * 100);

      // Determinar si es "jorobado"
      const jorobadoPrediction = this.predictions.find(
        (prediction) =>
          prediction.className.toLowerCase() === 'jorobado' && prediction.probability > 0.5
      );

      if (jorobadoPrediction) {
        this.predictionMessage = 'Tu postura parece jorobada. Visita este sitio para mejorarla:';
        this.recommendationLink = 'https://medlineplus.gov/spanish/guidetogoodposture.html';
        this.isJorobado = true;
      } else {
        this.predictionMessage = '¡Felicidades! Tu postura es excelente.';
        this.recommendationLink = '';
        this.isJorobado = false;
      }

      this.showMessage = true;

      // Actualizar gráfico
      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = probabilities;
        this.chart.update();
      } else {
        this.createChart(labels, probabilities);
      }
    } catch (error) {
      console.error(error);
      alert('Error al realizar la predicción.');
    }
  }

  /* Método para crear un gráfico */
  createChart(labels: string[], data: number[]) {
    const ctx = this.resultChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            label: 'Porcentaje',
            data,
            backgroundColor: ['#FF6384', '#36A2EB'], // Colores personalizados
            hoverBackgroundColor: ['#FF6384', '#36A2EB'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }
}
