import * as React from 'react';
import ReactDOM, { findDOMNode } from 'react-dom';
import { MultiSelect, SimpleSelect } from 'react-selectize';
//import registeredComponents from '../constants/registeredComponents';
//import { getOutcome } from './outcome';
//import { checkBooleanString } from './utils/DataUtils';
import { renderOutcomesInOrder } from './CoreUtils';
//import { uniqWith } from 'ramda'; 

declare var manywho: any;

interface IToggleState {
}

export default class ExtendedToggle extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
    }

    handleChange: (e: { target: { checked: Boolean; } }) => void = async (e) => {
        manywho.state.setComponent(
            this.props.id,
            { contentValue: e.target.checked },
            this.props.flowKey,
            true,
        );
        let model: any = manywho.model.getComponent(this.props.id, this.props.flowKey);
        let outcomes: any = manywho.model.getOutcomes(this.props.id,this.props.flowKey);
        let changeOutcome: any  = outcomes.find((outcome: any) => outcome.developerName === (model.attributes?.onChange? model.attributes.onChange : "onChange"));
        if(changeOutcome) {
            await manywho.component.onOutcome(changeOutcome, null, this.props.flowKey); 
        }
        else {
            manywho.component.handleEvent(this, model, this.props.flowKey)
        }
    }

    handleEvent: () => void = () => {
        manywho.component.handleEvent(
            this,
            manywho.model.getComponent(this.props.id, this.props.flowKey), 
            this.props.flowKey,
        );
    }

    render() {
        const model = manywho.model.getComponent(this.props.id, this.props.flowKey);

        const Outcome = manywho.component.getByName("OUTCOME");

        manywho.log.info(`Rendering Toggle: ${this.props.id}, ${model.developerName}`);

        const state = manywho.state.getComponent(this.props.id, this.props.flowKey) || {};
        const outcomes: any = manywho.model.getOutcomes(this.props.id, this.props.flowKey);
        const outcomeElements: (JSX.Element)[] = outcomes && outcomes
            .map((outcome: any) => <Outcome id={outcome.id} flowKey={this.props.flowKey} />);

        let className = (manywho.styling.getClasses(
            this.props.parentId,
            this.props.id,
            'toggle',
            this.props.flowKey,
        )).join(' ');

        if (model.isValid === false || state.isValid === false)
            className += ' has-error';

        if (model.isVisible === false)
            className += ' hidden';

        const contentValue = state &&
            state.contentValue != null ? state.contentValue : model.contentValue;

        const props: any = {
            type: 'checkbox',
            readOnly: !model.isEditable,
            required: model.isRequired,
            disabled: !model.isEnabled,
            checked: (typeof contentValue === 'string' && manywho.utils.isEqual(
                contentValue, 'true', true,
            )) || contentValue === true,
        };

        if (!this.props.isDesignTime) {
            if (model.isEditable) {
                props.onChange = this.handleChange;
            }
            props.onBlur = this.handleEvent;
        }

        const backgrounds = [null, 'success', 'info', 'warning', 'danger'];

        let shape = manywho.settings.global('toggle.shape', this.props.flowKey, null);
        let background = manywho.settings.global('toggle.background', this.props.flowKey, null);

        if (model.attributes) {
            if (typeof model.attributes.shape !== 'undefined')
                shape = model.attributes.shape;

            if (typeof model.attributes.background !== 'undefined')
                background = model.attributes.background;
        }

        const sliderClassName = `${shape} ${(background) ? background : ''}`;
        let style = null;

        if (backgrounds.indexOf(background) === -1)
            style = { background };

        const toggle = (
            <div id={this.props.id}>
                <label>{model.label}</label>
                <div className="toggle-button">
                    <label>
                        <input {...props} />
                        <div className={sliderClassName} style={style} />
                    </label>
                </div>
                <span className="help-block">{model.validationMessage || state.validationMessage}</span>
                <span className="help-block">{model.helpInfo}</span>
            </div>
        );

        return (
            <div className={className}>
                {renderOutcomesInOrder(toggle, outcomeElements, outcomes, model.isVisible)}
            </div>
        );
    }

}

manywho.component.register("ExtendedToggle", ExtendedToggle);

