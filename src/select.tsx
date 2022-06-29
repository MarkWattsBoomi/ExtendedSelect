import { FlowComponent, FlowObjectData } from 'flow-component-model';
import * as React from 'react';

declare const manywho: any;

interface IDropDownState {
    options?: any[];
    search?: string;
    isOpen?: boolean;
}

export default class ExtendedSelect extends FlowComponent {

    comboBox: HTMLSelectElement;
    objData: Map<string,FlowObjectData>;

    constructor(props: any) {
        super(props);
        this.state = { options: []};

        this.getOptions = this.getOptions.bind(this);
        this.getOptions = this.getOptions.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.moveHappened = this.moveHappened.bind(this);       
    }

    async componentDidMount() {
        await super.componentDidMount();   
        (manywho as any).eventManager.addDoneListener(this.moveHappened, this.componentId);
        this.getOptions();
    }

    async componentWillUnmount() {
        (manywho as any).eventManager.removeDoneListener(this.componentId);
    }

    moveHappened(xhr: XMLHttpRequest, request: any) {
        if ((xhr as any).invokeType === 'FORWARD') {
            this.getOptions();
        }
    }
    
    
    async onClear() {
        let clearOutcome: string  = this.getAttribute("onClear", "onClear");
        await this.doOutcome(clearOutcome);
    }

    async onSelect(value: any) {
        let selectOutcome: string  = this.getAttribute("onSelect", "onSelect");
        let objData: FlowObjectData = this.objData.get(value.currentTarget.options[value.currentTarget.selectedIndex].value);
        await this.setStateValue(objData);
        await this.doOutcome(selectOutcome)
    }

    async doOutcome(outcomeName: string) {
        if(this.outcomes[outcomeName]) {
            this.triggerOutcome(outcomeName);
        }
        else {
            manywho.component.handleEvent(this, null, this.flowKey)
        }
    }

    
    getOptions() {
        let opts: any[] = [];
        this.objData = new Map();
        let sel: FlowObjectData = this.getStateValue() as FlowObjectData;
        this.model.dataSource?.items?.forEach((item: FlowObjectData) => {
            this.objData.set(item.internalId, item);
            opts.push(
                <option
                    value={item.internalId}
                    selected={sel.internalId === item.internalId || item.isSelected===true}
                >
                    {item.properties[this.model.displayColumns[0].developerName].value as string}
                </option>
            );
        });
        this.setState({options: opts})    
    }

    
    render() {
        
        let className = manywho.styling.getClasses(
            this.props.parentId,
            this.props.id,
            'select',
            this.props.flowKey,
        ).join(' ');

        className += ' form-group';

        if (this.model.visible === false) {
            className += ' hidden';
        }

        const style: React.CSSProperties = {};
        let widthClassName = null;
        style.display = 'block';
        style.padding = "5px 1.5rem 5px 0.5rem";
        if (this.model.width && this.model.width > 0) {
            style.width = this.model.width + "px";
            style.minWidth = style.width;
            widthClassName = 'width-specified';
            
        }

        return (
            <div 
                className={className}
            >
                <div
                    id={this.props.id} 
                >
                    <label>
                        {this.model.label}
                        {this.model.required ? <span className="input-required"> * </span> : null}
                    </label>
                    <select
                        style={style} 
                        className={widthClassName}
                        onChange={this.onSelect}
                    >
                        {this.state.options}
                    </select>
                    <span className="help-block">
                        {
                            this.model.validationMessage
                        }
                    </span>
                    <span 
                        className="help-block"
                    >
                        {this.model.helpInfo}
                    </span>
                </div>
            </div>
        );
    }
}

manywho.component.register("ExtendedSelect", ExtendedSelect);

//export const getSelect = () : typeof Select => manywho.component.getByName("select");

//export default Select;