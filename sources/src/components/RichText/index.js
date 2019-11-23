import React from 'react';
import PropTypes from 'prop-types';
import { useICE } from '../../services/util';

const RichText = props => (
  <div
    className={props.classes}
    { ...useICE({ path: props.cmsId, modelId: props.objectId }).props }
  >
    <div dangerouslySetInnerHTML={{ __html: props.copy }} />
  </div>
);

RichText.propTypes = {
  copy: PropTypes.string.isRequired
};

export default RichText;
