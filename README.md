
The latest version can be included in your player from this location: -

```
https://files-manywho-com.s3.amazonaws.com/e1dbcceb-070c-4ce6-95b0-ba282aaf4f48/select.js
```

A running demo can be seen here: -

Coming Soon


A sharing token of that example flow is: -

Coming Soon


NOTE: Visibility based on page conditions is respected.



# ExtendedSelect


## Functionality

Provides all the standard function, look & feel of the OOB combo box but with the addition of: -

### onSelect event

When one or more items are selected in the combo the selection is persisted to the state.

If this outcome is attached it will then be triggered.

If the outcome is not defined then a normal event will be triggered to run the page conditions.


### onClear event.

When the combo's selected items are cleared the empty value is persisted to the state.

If this outcome is attached it will then be triggered.

If the outcome is not defined then a normal event will be triggered to run the page conditions.


## Component Attributes

### onSelect
String.

Optional.

The name of an outcome, attached to the combo box, to be triggered when a value / values are selected.


### onClear
String.

Optional.

The name of an outcome, attached to the combo box, to be triggered when the combo's value is cleared.





