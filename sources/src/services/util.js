import React from 'react';

export const formatPrice = (x, currency) => {
  switch (currency) {
    case 'BRL':
      return x.toFixed(2).replace('.', ',');
    default:
      return x.toFixed(2);
  }
};

export const productsAPI =
  'http://localhost:8080/api/products.json?crafterSite=reactcart';

// export const productsAPI = "http://localhost:8001/api/products";


export function useICE({ path, modelId }) {
  const isEmbedded = path?.includes(':');
  path = path?.split(':')[0];
  return {
    props: {
      ...isEmbedded ? { 'data-studio-embedded-item-id': modelId } : {},
      'data-studio-component-path': path,
      'data-studio-component': path,
      'data-studio-ice-path': path,
      'data-studio-ice': ''
    }
  };
}

export function useDropZone({ modelId, zoneName, contentType }) {
  return {
    props: {
      'data-studio-components-target': zoneName,
      'data-studio-components-objectid': modelId,
      'data-studio-zone-content-type': contentType
    }
  };
}
