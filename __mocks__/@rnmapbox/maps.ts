import React from 'react';

const MapView = (props: any) => React.createElement('MapView', props);
const Camera = (props: any) => React.createElement('Camera', props);
const PointAnnotation = (props: any) => React.createElement('PointAnnotation', props);
const ShapeSource = (props: any) => React.createElement('ShapeSource', props);
const SymbolLayer = (props: any) => React.createElement('SymbolLayer', props);

export default { MapView, Camera, PointAnnotation, ShapeSource, SymbolLayer };
export { MapView, Camera, PointAnnotation, ShapeSource, SymbolLayer };
