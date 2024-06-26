import { eLoadingState, FlowComponent, FlowObjectData } from 'flow-component-model';
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
        this.removeBlankOption = this.removeBlankOption.bind(this);  
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
        let intId: string = value.currentTarget.options[value.currentTarget.selectedIndex].value;
        if(intId?.length > 0){
            this.removeBlankOption();
            let objData: FlowObjectData = this.objData.get(value.currentTarget.options[value.currentTarget.selectedIndex].value);
            await this.setStateValue(objData);
            await this.doOutcome(selectOutcome)
        }
    }

    async doOutcome(outcomeName: string) {
        if(this.outcomes[outcomeName]) {
            this.triggerOutcome(outcomeName);
        }
        else {
            manywho.component.handleEvent(
                this,
                manywho.model.getComponent(
                    this.componentId,
                    this.flowKey,
                ),
                this.flowKey,
                null,
            );
        }
    }

    
    getOptions() {
        let opts: any[] = [];
        this.objData = new Map();
        let sel: FlowObjectData = this.getStateValue() as FlowObjectData;
        let selected: boolean = false;
        
        this.model.dataSource?.items?.forEach((item: FlowObjectData) => {
            this.objData.set(item.internalId, item);
            let thisSelected: boolean = ((sel?.internalId === item.internalId) || (item.isSelected===true));
            if(thisSelected){selected = thisSelected}

            opts.push(
                <option
                    value={item.internalId}
                    selected={thisSelected}
                >
                    {item.properties[this.model.displayColumns[0].developerName].value as string}
                </option>
            );
        });
        if(selected === false) {
            opts.splice(0,0,
                <option
                    value={""}
                    selected={true}
                >
                    {this.getAttribute("noSelection","Please select ...")}
                </option>
            );
        }
        this.setState({options: opts})    
    }

    removeBlankOption() {
        let newOpts: any[] = [];
        for(let pos = 0 ; pos < this.state.options.length ; pos++) {
            if(this.state.options[pos].props.value!=="") {
                newOpts.push(this.state.options[pos]);
            }
        }
        this.setState({options: newOpts});
    }

    
    render() {
        let className: string = "";

        try{
            if(this.loadingState === eLoadingState.ready) {
                let className = manywho.styling.getClasses(
                    this.parentId,
                    this.componentId,
                    'select',
                    this.flowKey,
                ).join(' ');
            }
        }
        catch(e: any){
            //do nothing
        }

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