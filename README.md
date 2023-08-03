# Notes with Anchors
This module (a) extends to canvas notes the functionality found in content links of being able to link directly to page anchors in journal pages, and (b) modifies the *Jump To Pin* feature to behave as expected when using it to jump to a Note created with a page anchor.

### How-To
Drag journal entries, pages, or section names from a journal sidebar and configure them as you normally would. The only difference is that you will be able to link to specific sections within journal pages (anchors) rather than being limited to linking to just whole pages or whole journal entries.

### Settings
When a note links to an anchor, having all of its three constituent names displayed underneath typically causes it to become unweildly long, but using only one of those names can leave the label devoid of essential meaning. As such, a few settings are provided to configure the default label configuration of notes.

##### Note Label Separator
A client-defined string that will be placed between the composing names of a note's label. For example, if a note refers to a section named `Mysterious Obelisk`, on a page named `Goblin Cave`, in a journal entry named `Mildale Forest`, and the user has specified that they would like a separator of ` > `, the label that the note will receive by default will be `Mildale Forest > Goblin Cave > Mysterious Obelisk`

##### Include <Journal Entry / Journal Entry Page / Anchor> Name
As can be seen in the Note Label Separator example, the labels can become fairly long. Each of these settings toggles whether or not its respective item's name should be included in the composed, default label. Note that the verbose labeling only occurs when a note links to an anchor, and otherwise uses the default Foundry labeling behavior of using either the journal entry name, or instead the journal entry page name, if it exists.
