import React, { PropTypes } from 'react';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormLegend from 'components/forms/form-legend';
import FormRadio from 'components/forms/form-radio';
import sanitizeHTML from 'lib/utils/sanitize-html';
import FieldDescription from 'components/field-description';

const RadioButton = ( { value, currentValue, setValue, description } ) => {
	return (
		<FormLabel>
			<FormRadio value={ value } checked={ value === currentValue } onChange={ () => setValue( value ) } />
			<span dangerouslySetInnerHTML={ sanitizeHTML( description ) } />
		</FormLabel>
	);
};

const RadioButtons = ( { valuesMap, title, description, value, setValue } ) => {
	return (
		<FormFieldset>
			<FormLegend dangerouslySetInnerHTML={ sanitizeHTML( title ) } />
			<FieldDescription text={ description } />
			{ Object.keys( valuesMap ).map( ( key ) => {
				return (
					<RadioButton
						key={ key }
						value={ key }
						currentValue={ value }
						setValue={ setValue }
						description={ valuesMap[ key ] }
					/>
				);
			} ) }
		</FormFieldset>
	);
};

RadioButtons.propTypes = {
	valuesMap: PropTypes.object.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
	value: PropTypes.string.isRequired,
	setValue: PropTypes.func.isRequired,
};

export default RadioButtons;
