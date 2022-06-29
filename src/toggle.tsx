import { FlowComponent } from 'flow-component-model';
import * as React from 'react';

declare var manywho: any;

interface IToggleState {
}

export default class ExtendedToggle extends FlowComponent {

    constructor(props: any) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(e: any) {

    }
    
    render() {
    
        let className = (manywho.styling.getClasses(
            this.props.parentId,
            this.props.id,
            'toggle',
            this.props.flowKey,
        )).join(' ');

        if (this.model.visible === false)
            className += ' hidden';

        const checked: boolean = this.getStateValue() as boolean;

        const props: any = {
            type: 'checkbox',
            readOnly: this.model.readOnly,
            required: this.model.required,
            disabled: !this.model.enabled,
            checked: checked,
            onChange : this.onChange
        };

    

        const backgrounds = [null, 'success', 'info', 'warning', 'danger'];

        let shape = manywho.settings.global('toggle.shape', this.props.flowKey, null);
        let background = manywho.settings.global('toggle.background', this.props.flowKey, null);

        //if (model.attributes) {
        //    if (typeof model.attributes.shape !== 'undefined')
        //        shape = model.attributes.shape;

        //    if (typeof model.attributes.background !== 'undefined')
        //        background = model.attributes.background;
        //}

        const sliderClassName = `${shape} ${(background) ? background : ''}`;
        let style = null;

        if (backgrounds.indexOf(background) === -1)
            style = { background };

        return (
            <div id={this.props.id}>
                <label>{this.model.label}</label>
                <div className="toggle-button">
                    <label>
                        <input {...props} />
                        <div className={sliderClassName} style={style} />
                    </label>
                </div>
                <span className="help-block">{this.model.validationMessage}</span>
                <span className="help-block">{this.model.helpInfo}</span>
            </div>
        );
    }

}

manywho.component.register("ExtendedToggle", ExtendedToggle);

