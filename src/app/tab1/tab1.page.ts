import { ViewChild, ElementRef,Component, signal } from '@angular/core';
import { IonCardContent, IonButton, IonList, IonItem, IonLabel,IonFab, IonFabButton, IonIcon, IonCard,IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
/* Importe el pipe */
import { PercentPipe } from '@angular/common';
/* Importe la función y el ícono */
import { addIcons } from 'ionicons';
import { cloudUploadOutline } from 'ionicons/icons';
/* Importe el servicio */
import { TeachablemachineService } from '../services/teachablemachine.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tab1',
  standalone: true,
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [PercentPipe,IonCardContent, IonButton, IonList, IonItem, IonLabel,IonFab, IonFabButton, IonIcon, IonCard,IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})

export class Tab1Page {

  imageReady = signal(false)
  imageUrl = signal("")

  /* Declare los atributos para almacenar el modelo y la lista de clases */
  modelLoaded = signal(false);
  classLabels: string[] = [];
  /* Declare la referencia al elemento con el id image */
  @ViewChild('image', { static: false }) imageElement!: ElementRef<HTMLImageElement>;

  /* Lista de predicciones */
  predictions: any[] = [];

  @ViewChild('resultChart', { static: false }) resultChart!: ElementRef; // Referencia al gráfico
  chart: any; // Variable para almacenar el gráfico

  constructor(private teachablemachine: TeachablemachineService) {
     /* Registre el ícono */
     addIcons({ cloudUploadOutline });
  }

  /* El método onSubmit para enviar los datos del formulario mediante el servicio */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
    
      const reader = new FileReader();

      // Convertir el archivo a una URL base64 para mostrarlo en el html
      reader.onload = () => {
        this.imageUrl.set(reader.result as string)
        this.imageReady.set(true)
      };
      reader.readAsDataURL(file); // Leer el archivo como base64
    }
  }


  /* Método ngOnInit para cargar el modelo y las clases */
  async ngOnInit() {
    await this.teachablemachine.loadModel()
    this.classLabels = this.teachablemachine.getClassLabels()
    this.modelLoaded.set(true)
  }

  /* Método para obtener la predicción a partir de la imagen */
  async predict() {
    try {
      const image = this.imageElement.nativeElement;
      this.predictions = await this.teachablemachine.predict(image);

      // Extraer etiquetas y probabilidades
      const labels = this.predictions.map((pred) => pred.className);
      const probabilities = this.predictions.map((pred) => pred.probability * 100);

      // Crear o actualizar el gráfico
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

  createChart(labels: string[], data: number[]) {
    const ctx = this.resultChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'pie', // Cambiado a gráfico de pastel
      data: {
        labels,
        datasets: [
          {
            label: 'Porcentaje',
            data,
            backgroundColor: ['#FF6384', '#36A2EB'], // Colores personalizados
            hoverBackgroundColor: ['#FF6384', '#36A2EB'], // Colores al pasar el mouse
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top', // Mostrar leyenda en la parte superior
          },
        },
      },
    });
  }

}
