import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import leaflet from 'leaflet';
import PubSub from 'pubsub-js';

type Props = {
  latitudeLongitudeData: Array<{ latitude: number | null; longitude: number | null }>;
  allowZoom: boolean;
  renderStartAndEndFlag: boolean;
};

export default class Map extends React.Component<Props> {
  mapId: string;

  startMarkerSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#009900" viewBox="0 0 16 16"><path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001"/></svg>';

  startMarkerIcon = new leaflet.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(this.startMarkerSvg)}`,
    iconSize: [25, 25],
    iconAnchor: [4, 25],
  });

  finishMarkerSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#990000" viewBox="0 0 16 16"><path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001"/></svg>';

  finishMarkerIcon = new leaflet.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(this.finishMarkerSvg)}`,
    iconSize: [25, 25],
    iconAnchor: [4, 25],
  });

  hoverMarkerSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#00aaff" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';

  hoverMarkerIcon = new leaflet.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(this.hoverMarkerSvg)}`,
    iconSize: [25, 25],
    iconAnchor: [12.5, 25],
  });

  hoverMarkerReference: leaflet.Marker | undefined;

  zoomPolyline: leaflet.Polyline | undefined;

  constructor(props: Props) {
    super(props);
    this.mapId = uuidv4();
  }

  componentDidMount(): void {
    const { props } = this;

    const routeToPlot: Array<[number, number]> = [];
    const firstNonNullValue = props.latitudeLongitudeData.find((x) => x.latitude != null && x.longitude !== null);
    if (firstNonNullValue === undefined) {
      return;
    }
    let minLatitude = Number(firstNonNullValue.latitude);
    let maxLatitude = minLatitude;
    let minLongitude = Number(firstNonNullValue.longitude);
    let maxLongitude = minLongitude;

    for (let i = 0; i < props.latitudeLongitudeData.length; i += 1) {
      const { latitude } = props.latitudeLongitudeData[i];
      const { longitude } = props.latitudeLongitudeData[i];
      if (latitude !== null && longitude !== null) {
        routeToPlot.push([latitude, longitude]);
        if (latitude < minLatitude) {
          minLatitude = latitude;
        }
        if (latitude > maxLatitude) {
          maxLatitude = latitude;
        }
        if (longitude < minLongitude) {
          minLongitude = longitude;
        }
        if (longitude > maxLongitude) {
          maxLongitude = longitude;
        }
      }
    }

    // Configure the map
    const map = leaflet.map(this.mapId, { zoomControl: props.allowZoom, scrollWheelZoom: props.allowZoom, dragging: props.allowZoom }).fitBounds([
      [minLatitude, maxLongitude],
      [maxLatitude, minLongitude],
    ]);
    leaflet
      .tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map);

    // Add start and end markers
    if (props.renderStartAndEndFlag) {
      if (firstNonNullValue.latitude !== null && firstNonNullValue.longitude !== null) {
        leaflet.marker([firstNonNullValue.latitude, firstNonNullValue.longitude], { icon: this.startMarkerIcon }).addTo(map);
      }
      const lastNonNullValue = props.latitudeLongitudeData
        .slice()
        .reverse()
        .find((x) => x.latitude != null && x.longitude !== null);
      if (lastNonNullValue !== undefined && lastNonNullValue.latitude !== null && lastNonNullValue.longitude !== null) {
        leaflet.marker([lastNonNullValue.latitude, lastNonNullValue.longitude], { icon: this.finishMarkerIcon }).addTo(map);
      }
    }

    // Plot the route
    leaflet
      .polyline(routeToPlot)
      .setStyle({
        color: '#b3b3b3',
      })
      .addTo(map);

    // When the Performance Analysis chart is hovered over on the Activity page, show the corresponding location on the map
    PubSub.subscribe('performance-analysis-chart-hover', (_msg: unknown, hoveredIndex: number) => {
      const target = props.latitudeLongitudeData[hoveredIndex];
      if (target.latitude !== null && target.longitude !== null) {
        if (this.hoverMarkerReference !== undefined) {
          map.removeLayer(this.hoverMarkerReference);
        }
        this.hoverMarkerReference = leaflet.marker([target.latitude, target.longitude], { icon: this.hoverMarkerIcon }).addTo(map);
      }
    });

    // When the user stops hovering over the Performance Analysis chart, remove the marker from the map
    PubSub.subscribe('performance-analysis-chart-hover-end', () => {
      if (this.hoverMarkerReference !== undefined) {
        map.removeLayer(this.hoverMarkerReference);
      }
    });

    // When the Performance Analysis chart is zoomed, zoom to the corresponding section of the map
    PubSub.subscribe('performance-analysis-chart-zoom', (_msg: unknown, args: { startIndex: number; endIndex: number }) => {
      if (this.zoomPolyline !== undefined) {
        map.removeLayer(this.zoomPolyline);
      }

      const zoomedRouteToPlot: Array<[number, number]> = [];
      const targetData = props.latitudeLongitudeData.slice(args.startIndex, args.endIndex + 1);
      const firstNonNullValueInTargetData = targetData.find((x) => x.latitude != null && x.longitude !== null);
      if (firstNonNullValueInTargetData === undefined) {
        return;
      }
      let minLatitudeOfZoomedData = Number(firstNonNullValueInTargetData.latitude);
      let maxLatitudeOfZoomedData = minLatitudeOfZoomedData;
      let minLongitudeOfZoomedData = Number(firstNonNullValueInTargetData.longitude);
      let maxLongitudeOfZoomedData = minLongitudeOfZoomedData;

      for (let i = 0; i < targetData.length; i += 1) {
        const { latitude } = targetData[i];
        const { longitude } = targetData[i];
        if (latitude !== null && longitude !== null) {
          zoomedRouteToPlot.push([latitude, longitude]);
          if (latitude < minLatitudeOfZoomedData) {
            minLatitudeOfZoomedData = latitude;
          }
          if (latitude > maxLatitudeOfZoomedData) {
            maxLatitudeOfZoomedData = latitude;
          }
          if (longitude < minLongitudeOfZoomedData) {
            minLongitudeOfZoomedData = longitude;
          }
          if (longitude > maxLongitudeOfZoomedData) {
            maxLongitudeOfZoomedData = longitude;
          }
        }
      }

      this.zoomPolyline = leaflet.polyline(zoomedRouteToPlot, { color: 'red' }).addTo(map);
      map.fitBounds([
        [minLatitudeOfZoomedData, maxLongitudeOfZoomedData],
        [maxLatitudeOfZoomedData, minLongitudeOfZoomedData],
      ]);
    });

    // When the Performance Analysis chart is zoom is reset, show the full route on the map
    PubSub.subscribe('performance-analysis-chart-zoom-reset', () => {
      if (this.zoomPolyline !== undefined) {
        map.removeLayer(this.zoomPolyline);
      }
      map.fitBounds([
        [minLatitude, maxLongitude],
        [maxLatitude, minLongitude],
      ]);
    });
  }

  componentWillUnmount() {
    PubSub.unsubscribe('performance-analysis-chart-hover');
    PubSub.unsubscribe('performance-analysis-chart-hover-end');
    PubSub.unsubscribe('performance-analysis-chart-zoom');
    PubSub.unsubscribe('performance-analysis-chart-zoom-reset');
  }

  render(): JSX.Element {
    return <div id={this.mapId} className="w-100 h-100" />;
  }
}
