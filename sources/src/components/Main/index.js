import React from 'react';
import DynamicComponent from '../DynamicComponent';
import { useDropZone, useICE } from '../../services/util';

const Main = (props) => (
  <div
    {...useICE({ path: props.cmsId, modelId: props.objectId }).props}
  >
    <main
      {
        ...useDropZone({
          path: props.cmsId,
          modelId: props.objectId,
          zoneName: 'col1',
          contentType: '/component/main'
        }).props
      }
    >
      <DynamicComponent items={props.col1.item}/>
    </main>
  </div>
);


export default Main;
