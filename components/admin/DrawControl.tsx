import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';

import type { ControlPosition } from 'react-map-gl';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;
  onCreate?: (evt: {features: object[]}) => void;
  onUpdate?: (evt: {features: object[]; action: string}) => void;
  onDelete?: (evt: {features: object[]}) => void;
  onDrawControlLoaded?: (draw: MapboxDraw) => void;
};

export default function DrawControl(props: DrawControlProps) {
  const draw = useControl<MapboxDraw>(
    () => new MapboxDraw(props),
    ({map}: {map: any}) => {
      map.on('draw.create', props.onCreate as any);
      map.on('draw.update', props.onUpdate as any);
      map.on('draw.delete', props.onDelete as any);
    },
    ({map}: {map: any}) => {
      map.off('draw.create', props.onCreate as any);
      map.off('draw.update', props.onUpdate as any);
      map.off('draw.delete', props.onDelete as any);
    },
    {
      position: props.position
    }
  );

  if (props.onDrawControlLoaded && draw) {
     props.onDrawControlLoaded(draw);
  }

  return null;
}
