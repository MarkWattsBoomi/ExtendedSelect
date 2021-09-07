import * as React from 'react';
import ReactDOM, { findDOMNode } from 'react-dom';
import { MultiSelect, SimpleSelect } from 'react-selectize';
//import registeredComponents from '../constants/registeredComponents';
//import { getOutcome } from './outcome';
//import { checkBooleanString } from './utils/DataUtils';
import { renderOutcomesInOrder } from './CoreUtils';
//import { uniqWith } from 'ramda'; 

declare const manywho: any;

interface IDropDownState {
    options?: any[];
    search?: string;
    isOpen?: boolean;
}

export default class ExtendedSelect extends React.Component<any,any> {

    debouncedOnSearch: any = null;
    debouncedOnScroll: any = null;
    comboBoxRef: any;
    selectizeRef: any;

    constructor(props: any) {
        super(props);
        this.state = { options: [], search: '', isOpen: false };

        this.getOptions = this.getOptions.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
        this.onValuesChange = this.onValuesChange.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.onOpenChange = this.onOpenChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.isScrollLimit = this.isScrollLimit.bind(this);

        this.debouncedOnSearch = manywho.utils.debounce(this.props.onSearch, 750);
        this.debouncedOnScroll = manywho.utils.debounce(this.isScrollLimit, 100);

        // This is a DOM element ref that can be used to interact with the DOM
        this.comboBoxRef = React.createRef();
        // This is a Component ref to interact with the react-selectize component
        this.selectizeRef = React.createRef();
    }

    componentWillMount() {
        this.setState({ options: this.getOptions(this.props.objectData || []) });
        window.addEventListener('blur', this.onWindowBlur);
    }

    componentDidMount() {
        //this.comboBoxRef.current.querySelector('input').classList.add('prevent-submit-on-enter');
    }

    componentWillReceiveProps(nextProps: any) {
        const model = manywho.model.getComponent(this.props.id, this.props.flowKey);
        const state = manywho.state.getComponent(this.props.id, this.props.flowKey);

        const doneLoading = this.props.isLoading && !nextProps.isLoading;
        const hasRequest = model.objectDataRequest !== null || model.fileDataRequest !== null;
        // if there is nothing in nextProps.objectData then use an [] to
        // properly cover this case later when building the options array
        const nextPropsObjectData = nextProps.objectData || [];

        if ((doneLoading || !hasRequest) && !nextProps.isDesignTime) {
            let options: any = [];

            if (
                nextProps.page > 1 &&
                this.state.options.length < nextProps.limit * nextProps.page
            ) {
                // add next page of options to end
                options = this.addOptions(this.state.options, this.getOptions(nextPropsObjectData), true);
                this.setState({ isOpen: true });

                const index = this.state.options.length + 1;

                setTimeout(() => {
                    const dropdown: HTMLDivElement =
                        (findDOMNode(this) as HTMLDivElement)
                            .querySelector('.dropdown-menu');
                    const scrollTarget = dropdown.children.item(index) as HTMLElement;
                    dropdown.scrollTop = scrollTarget.offsetTop;
                });
            } else {
                // replace options
                options = this.addOptions(this.getOptions(nextPropsObjectData), options, false);
            }

            if (state && state.objectData) {
                // add selected options to start
                options = this.addOptions(options, this.getOptions(state.objectData), false);
            }

            this.setState({ options });
        }

        if (!this.props.isLoading && nextProps.isLoading) {
            this.setState({ isOpen: false });
        }

        if (
            this.props.isLoading &&
            !nextProps.isLoading &&
            !manywho.utils.isNullOrWhitespace(this.state.search)
        ) {
            this.setState({ isOpen: true });
        }
    }

    componentDidUpdate(prevProps: any, prevState: any) {
        if (!prevState.isOpen && this.state.isOpen) {

            // Timeout to ensure the dropdown has had a chance to render before accessing it's child elements
            setTimeout(
                () => {
                    const model = manywho.model.getComponent(this.props.id, this.props.flowKey);
                    const element = (findDOMNode(this) as HTMLElement);

                    if (
                        model.attributes &&
                        manywho.utils.isEqual(model.attributes.isTethered, 'true', true)
                    ) {
                        const dropdown: HTMLElement =
                            document.querySelector('.tether-element .dropdown-menu') as HTMLElement;

                        const selectize: HTMLElement =
                            element.querySelector('.react-selectize') as HTMLElement;

                        if (dropdown !== null) {
                            dropdown.addEventListener('scroll', this.debouncedOnScroll);
                            dropdown.style.setProperty('width', selectize.offsetWidth +"px");
                        }

                    } else {
                        element.querySelector('.dropdown-menu')
                            .addEventListener('scroll', this.debouncedOnScroll);
                    }
                },
                10,
            );
        }
    }

    componentWillUnmount() {
        window.removeEventListener('blur', this.onWindowBlur);
    }

    onValueChange(option: any) {
        if (!this.props.isLoading) {
            let model: any = manywho.model.getComponent(this.props.id, this.props.flowKey);
            if (option) {
                //manywho.state.setComponent(option.value);
                //if(model)
                //this.props.select(option.value);
                this.onSelect(option.value);
            } else {
                //this.props.clearSelection();
                this.onClear();
            }
            this.setState({ isOpen: false });
        }
    }

    onValuesChange(options: any) {
        if (!this.props.isLoading) {
            if (options.length > 0) {
                //manywho.model.getComponent(this.props.id, this.props.flowKey);
                //this.props.select(options[options.length - 1].value);
                this.onSelect(options[options.length - 1].value);
            } else {
                //this.props.clearSelection();
                this.onClear();
            }
            
        }
    }

    async onClear() {
        const newState: any = {
            objectData: [],
            search: null
        };
        manywho.state.setComponent(this.props.id, newState, this.props.flowKey, true);
        let model: any = manywho.model.getComponent(this.props.id, this.props.flowKey);
        let outcomes: any = manywho.model.getOutcomes(this.props.id,this.props.flowKey);
        let clearOutcome: any  = outcomes.find((outcome: any) => outcome.developerName === (model.attributes?.onClear? model.attributes.onClear : "onClear"));
        if(clearOutcome) {
            await manywho.component.onOutcome(clearOutcome, null, this.props.flowKey); 
        }
        else {
            manywho.component.handleEvent(this, model, this.props.flowKey)
        }
    }

    async onSelect(value: any) {
        const model = manywho.model.getComponent(this.props.id, this.props.flowKey);
        const state = manywho.state.getComponent(this.props.id, this.props.flowKey);
        // We use the externalId when possible,
        // because for service data, the internalId is randomly generated
        // and not a reliable indicator of what is selected
        const getId = (anItem: any): string => anItem.externalId || anItem.internalId;

        let selectedItems = (state.objectData || [])
            .filter((anItem: any) => anItem.isSelected)
            .map((anItem: any) => anItem);

        let selectedItem: any = null;

        if (typeof value === 'string') {
            // In this case the string 'item' is the internalId of the selected item
            // so we have to use internalId to find the selected item
            [selectedItem] = model.objectData.filter(
                (objectData: any) => manywho.utils.isEqual(objectData.internalId, value, true),
            );
        } else if (typeof value === 'object') {
            selectedItem = value;
        }

        // Clone the selected item to remove references to it
        selectedItem = JSON.parse(JSON.stringify(selectedItem));

        const isSelected = selectedItems.filter(
            (anItem: any) => getId(anItem) === getId(selectedItem),
        ).length > 0;

        selectedItem.isSelected = !isSelected;

        if (model.isMultiSelect) {
            if (selectedItem.isSelected) {
                selectedItems.push(selectedItem);
            } else {
                selectedItems = selectedItems.filter((anItem: any) => !manywho.utils.isEqual(getId(anItem), getId(selectedItem), true));
            }
        } else if (selectedItem.isSelected) {
            selectedItems = [selectedItem];
        } else {
            selectedItems = [];
        }

        const newState: any = {
            objectData: selectedItems,
            search: null
        };

        manywho.state.setComponent(this.props.id, newState, this.props.flowKey, true);


        
        let outcomes: any = manywho.model.getOutcomes(this.props.id,this.props.flowKey);
        let selectOutcome: any  = outcomes.find((outcome: any) => outcome.developerName === (model.attributes?.onSelect? model.attributes.onSelect : "onSelect"));
        if(selectOutcome) {
            await manywho.component.onOutcome(selectOutcome, null, this.props.flowKey); 
        }
        else {
            manywho.component.handleEvent(this, model, this.props.flowKey)
        }
    }

    onSearchChange(search: any) {
        if (!this.props.isLoading && this.state.search !== search) {
            this.setState({ search });
            this.debouncedOnSearch(search);
        }
    }

    getClosest(className: string ) : any {
      let select: Element = ReactDOM.findDOMNode(this.comboBoxRef) as Element;
      let parent: Element = select.parentElement;
      while(!parent.classList.contains(className)){
        parent=parent.parentElement;
      }
      return parent;
    }


    onOpenChange(isOpen: any) {
        if (!this.props.isLoading) {
            this.setState({ isOpen });
            
            const select = this.comboBoxRef;
            const mainScroller =this.getClosest('main-scroller');

            // innerHeight - offsetTop gives us the space available underneath the select box
            const documentSpaceUnderDropdown = window.innerHeight - select.offsetTop;
            // every bit we've scrolled down give us more space under the dropdown
            const viewSpaceUnderDropdown = documentSpaceUnderDropdown + mainScroller.scrollTop;
            
            // The dropdown is 200px in height and scrolls if more is available (215px is what the docs suggest)
            // The select box node also includes the type-able input which can vary in height
            // If we have more than enough space to render downwards, we do that (1)
            // Otherwise we render upwards (-1)
            this.setState({ dropdownDirection: viewSpaceUnderDropdown < 215 + select.offsetHeight ? -1 : 1 });
        }
    }

    onFocus() {
        if (!this.props.isLoading) {
            this.setState({ isOpen: true });
        }
    }

    onBlur() {
        this.setState({ isOpen: false });
    }

    onWindowBlur = () => this.selectizeRef.current.blur();

    getOptions(objectData: any) {
        const model = manywho.model.getComponent(this.props.id, this.props.flowKey);
        const columns = manywho.component.getDisplayColumns(model.columns);

        if (columns && columns.length > 0) {
            const columnTypeElementPropertyId = columns[0].typeElementPropertyId;

            return objectData.map((item: any) => {

                const labelProperty = item.properties.find((value: any) => {
                    return manywho.utils.isEqual(
                        value.typeElementPropertyId,
                        columnTypeElementPropertyId,
                        true,
                    );
                });

                if (!labelProperty) {
                    manywho.log.error(
                        columnTypeElementPropertyId + " " + columnTypeElementPropertyId + " cannot be found in objectData item:",
                        item,
                    );
                }

                const optionText = labelProperty
                    ? manywho.formatting.format(
                        labelProperty.contentValue,
                        labelProperty.contentFormat,
                        labelProperty.contentType,
                        this.props.flowKey,
                    )
                    : '';

                return {
                    value: item,
                    label: optionText,
                };
            });
        }

        return [];
    }

    getUid(option: any) {
        return option.value.internalId;
    }

    /**
     * Merge our two options arrays preserving the order
     *
     * In the event of a duplicate the newOption should replace the existing option
     *
     * Match on `externalId` or the `internalId` because when offline there is no externalId
     *
     * @param {Array} existingOptions current list of options
     * @param {Array} newOptions extra options to append or replace. These new options may be the next page or the selected item(s).
     * @param {Boolean} append true for appending newOptions to existingOptions, otherwise they will prepended and reversed.
     */
    addOptions(existingOptions: any, newOptions: any, append: boolean) {
        if (append) {
            // Append the next page of options
            // Reverse the list before so newOptions replaces existingOptions for duplicates. Reverse again after to restore original order
            return this.removeDuplicateOptions([...existingOptions, ...newOptions].reverse()).reverse();
        }
        // Prepend the selected item(s) in reverse order
        return this.removeDuplicateOptions([...newOptions.reverse(), ...existingOptions]);
    }

    /**
     * Returns a list of unique option from the given list, only the first occurrence will remain
     * 
     * Match on `externalId` or the `internalId` because when offline there is no externalId
     * 
     * @param {Array} options list of options which duplicates will be removed from
     * @return {Array} the given list of options with duplicates removed
     */
    removeDuplicateOptions(options: Array<any>) : Array<any>{
        let dedup : Array<any> = [];
        options.forEach((option: any) => {
            let unique: boolean = true;
            dedup.forEach((option2: any) => {
                if(
                    (
                        option.value.externalId && 
                        option.value.externalId === option2.value.externalId
                    ) || 
                    (
                        option.value.internalId === option2.value.internalId
                    )
                ) { unique=false;}
            })
            if(unique===true) {
                dedup.push(option);
            }
        });
        return dedup;
    }

    isScrollLimit(e: any) {
        if (
            e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight &&
            this.props.hasMoreResults
        ) {
            this.props.onNext();
            this.setState({ isOpen: true });
        }
    }

    filterOptions(options: any) {
        return options;
    }

    render() {
        const model = manywho.model.getComponent(this.props.id, this.props.flowKey);

        const Outcome = "Outcome";

        manywho.log.info("Rendering Select: " + this.props.id , model.developerName);

        const state =
            this.props.isDesignTime ?
                { error: null, loading: null } :
                manywho.state.getComponent(this.props.id, this.props.flowKey) || {};

        const props: any = {
            filterOptions: this.filterOptions,
            uid: this.getUid,
            search: this.state.search,
            open: this.state.isOpen,
            theme: 'default',
            placeholder: model.hintValue,
            ref: this.selectizeRef,
        };

        if (!this.props.isDesignTime) {
            props.onValueChange = this.onValueChange;
            props.onValuesChange = this.onValuesChange;
            props.onSearchChange = this.onSearchChange;
            props.onOpenChange = this.onOpenChange;
            props.onBlur = this.onBlur;
            props.onFocus = this.onFocus;
            props.value = null;
            props.options = this.state.options;
            props.disabled = (model.isEnabled === false || model.isEditable === false);

            // If a multiselect is used then the values prop
            // must always be set on re-render as react selectize will
            // just reuse a previously selected value if no new values
            // are given back by the engine (e.g if an operator clears out the values).
            // I have just wrapped it in a condition just in case adding the values prop
            // for a simple select causes some kind of conflict.
            if (model.isMultiSelect) {
                props.values = [];
            }

            if (
                model.attributes &&
                manywho.utils.isEqual(model.attributes.isTethered, 'true', true)
            ) {
                props.tether = true;
            }

            if (this.props.objectData) {

                let internalIds: any = null;

                if (state && state.objectData) {
                    internalIds = state.objectData.map((item: any) => item.internalId);
                } else {
                    internalIds = this.props.objectData.filter((item: any) => item.isSelected || !item.isSelected)
                        .map((item: any) => item.internalId);
                }
                let values = null;

                if (internalIds && internalIds.length > 0) {
                    // Out of all available options only show
                    values = this.state.options.filter((option: any) =>
                        // options that are selected by internalId
                        internalIds.indexOf(option.value.internalId) !== -1 &&
                        // and options that don't have null labels
                        // (this fixes an issue where the engine returns a null labelled selected entry initially)
                        !manywho.utils.isNullOrWhitespace(option.label)
                    );
                }

                if (values) {
                    if (!model.isMultiSelect) {
                        props.value = values[0];
                    } else {
                        props.values = values;
                        props.anchor = values[values.length - 1];
                    }
                }
            }
        }

        

        let selectElement = null;

        if (model.isMultiSelect) {
            props.dropdownDirection = this.state.dropdownDirection;
            props.renderValue = (item: any) => (
                <div className="simple-value">
                    <span className="item-label">{item.label}</span>
                    <button
                        className="item-remove"
                        onMouseDown={e => {
                            this.props.select(item.value);
                            e.stopPropagation();
                        }}
                    >
                        <svg className="react-selectize-reset-button" focusable="false" width="8px" height="8px">
                            <path d="M0 0 L8 8 M8 0 L 0 8"></path>
                        </svg>
                    </button>
                </div>
            );
            selectElement = <MultiSelect {...props} />
        } else {
            selectElement = <SimpleSelect {...props} />;
        }

        let refreshButton = null;
        if (model.objectDataRequest || model.fileDataRequest) {
            let className = 'glyphicon glyphicon-refresh';

            let isDisabled = false;
            if (model.isEnabled === false || this.props.isLoading || model.isEditable === false) {
                isDisabled = true;
            }

            if (this.props.isLoading) {
                className += ' spin';
            }

            refreshButton = (
                <button
                    className="btn btn-default refresh-button"
                    onClick={this.props.refresh}
                    disabled={isDisabled}>
                    <span className={className} />
                </button>
            );
        }

        const outcomeButtons = this.props.outcomes && this.props.outcomes.map(
            (outcome: any) => {
              React.createElement("Outcome",{id: outcome.id, flowKey: this.props.flowKey})
            }
        );

        let className = manywho.styling.getClasses(
            this.props.parentId,
            this.props.id,
            'select',
            this.props.flowKey,
        ).join(' ');

        className += ' form-group';

        if (model.isVisible === false) {
            className += ' hidden';
        }

        if (model.isValid === false || state.isValid === false || state.error) {
            className += ' has-error';
        }

        const style: any = {};
        let widthClassName = null;

        if (model.width && model.width > 0) {
            style.width = model.width + "px";
            style.minWidth = style.width;
            widthClassName = 'width-specified';
        }

        const comboBox = (
            <div 
                id={this.props.id} 
                ref={(element: HTMLDivElement) => {this.comboBoxRef = element}}
            >
                <label>
                    {model.label}
                    {((model.isRequired + "").toLowerCase() === "true") ? <span className="input-required"> * </span> : null}
                </label>
                <div style={style} className={widthClassName}>
                    {selectElement}
                    {refreshButton}
                </div>
                <span className="help-block">
                    {
                        (state.error && state.error.message) ||
                        model.validationMessage ||
                        state.validationMessage
                    }
                </span>
                <span className="help-block">{model.helpInfo}</span>
            </div>
        );

        return (
            <div className={className}>
                {renderOutcomesInOrder(comboBox, outcomeButtons, this.props.outcomes, model.isVisible)}
            </div>
        );
    }
}

manywho.component.registerItems("ExtendedSelect", ExtendedSelect);

//export const getSelect = () : typeof Select => manywho.component.getByName("select");

//export default Select;