// react-native-maps needs its native module, which Jest doesn't have. The map renders as a View
// (testID "map") and each marker as a View with testID "pin <title>" that forwards onCalloutPress.
const { createElement } = require('react');
const { View } = require('react-native');

function MapView({ children }) {
  return createElement(View, { testID: 'map' }, children);
}
function Marker({ title, onCalloutPress }) {
  return createElement(View, { testID: `pin ${title}`, onCalloutPress });
}

module.exports = { __esModule: true, default: MapView, Marker };
