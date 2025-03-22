/**
 * Dropdown with checkboxes and search box
 * @Source: https://github.com/weihongji/html/tree/master/web/jesse-combobox
 * @Author: Jesse Wei
 * @Contact: weihongji@qq.com
 **/
class JesseCombobox {
	static instances = [];

	constructor(boxId, selectedIDs, onchange) {
		// Don't create duplicate object for same element.
		if (JesseCombobox.instances.find(x => x[boxId] != null)) {
			console.log('JesseCombobox object already exists for #' + boxId);
			return;
		}

		if (typeof boxId != 'string' || boxId == '') {
			console.error('Invalid argument to create JesseCombobox object. Id of a HTML element is expected.')
			return;
		}
		let box = $('#' + boxId);
		if (box.length == 0) {
			console.error('HTML element with id "' + boxId + '" is not found.');
			return;
		}

		this.context = box;
		this.tagPanel = $('.jesse-tags', this.context);
		this.addTagButton = $('.jesse-tag-add', this.context);
		this.dropdownPanel = $('.jesse-dropdown', this.context);
		this.dropdownMenu = $('.jesse-dropdown-menu', this.context);
		this.dropdownItemIDs = $('.jesse-dropdown-menu :checkbox', this.context).toArray().map(x => x.value);
		this.searchBox = $("input[type=search]", this.dropdownMenu);

		box.append($('<input/>', { type: 'hidden', id: box.data('name'), name: box.data('name'), value: '' }));
		this.hiddenField = $('#' + box.data('name'));

		this.onchange = onchange;
		this.setSelectedItems(selectedIDs, true);

		this.tagPanel.click(event => {
			if ($(event.target).hasClass('close')) { // Close button is clicked
				this.deselectItem($(event.target).prev('span').text());
			}
		});

		this.addTagButton.click(() => {
			if (this.dropdownPanel.is(":hidden")) {
				this.showDropdown();
			}
			else {
				this.hideDropdown();
			}
		});

		$('html').click(event => { // Use "html" instead of "body" so that event is triggered when click on blank area.
			if (this.context.find(event.target).hasClass('jesse-tag-add')) {
				return;
			}
			// Hide the dropdown if click any place out of the dropdown.
			if (this.dropdownPanel.is(":visible") && $(event.target).closest('.jesse-dropdown').length == 0) {
				this.hideDropdown();
			}
		});

		this.searchBox.keyup(event => {
			this.searchItem();
		});

		this.searchBox.on("search", event => {
			this.searchItem();
		});

		$(':checkbox', this.dropdownMenu).click(event => {
			if ($(event.target).is(":checked")) {
				this.selectItem(event.target);
			}
			else {
				this.deselectItem(event.target);
			}
		});

		JesseCombobox.instances.push({ [boxId]: this });
	}

	setSelectedItems(selectedIDs, initial) {
		if (typeof selectedIDs == 'object' && selectedIDs.constructor.name == 'Array') {
			selectedIDs = selectedIDs.toLocaleString();
		}
		selectedIDs = (selectedIDs || '').replaceAll(/[ \[\]]/g, ''); // Remove spaces and array brackets []
		this.hiddenField.val(selectedIDs);

		// Reset dropdown list if this is not the first call.
		if (!initial) {
			// Sort list items. Don't remove then re-create from a copy because events will be removed as well.
			for (let i = 0; i < this.dropdownItemIDs.length; i++) {
				let item = $(':checkbox[value=' + this.dropdownItemIDs[i] + ']', this.dropdownMenu).prop('checked', false).parent();
				this.dropdownMenu.append(item);
			}

			// Reset tag panel
			$('.jesse-tag-item.d-none', this.tagPanel).nextAll().remove();
		}

		let arrID = selectedIDs.length > 0 ? selectedIDs.split(',') : [];
		for (let i = 0; i < arrID.length; i++) {
			let checkbox = $(':checkbox', this.dropdownMenu).filter('[value=' + arrID[i] + ']');
			if (checkbox.length == 1) {
				checkbox.prop("checked", true);

				// Move forward on list
				checkbox.closest('label').insertBefore($('.dropdown-divider', this.context));

				// Add to tag panel
				let tag = $('.jesse-tags>div', this.context).first().clone().removeClass('d-none');
				tag.html(tag.html().replaceAll('xxx', checkbox.closest('label').text().trim()))
				this.tagPanel.append(tag);
			}
		}
	}

	showDropdown() {
		let itemHeight = 34;
		let dropdownHeigh = this.dropdownMenu.children().length * itemHeight - 14;
		let tagTop = this.context.get(0).getBoundingClientRect().top;
		let viewHeight = window.innerHeight;
		let downSpace = viewHeight - tagTop - this.tagPanel.height(); // Space below the "+" button
		let dropupTop = -(dropdownHeigh + this.tagPanel.height()) - 10;
		if (dropdownHeigh > downSpace) { // The dropdown overflows current view
			let handled = false;
			if (tagTop > dropdownHeigh) { // Space above the "+" button is enough for the dropdown.
				this.dropdownMenu.css('top', dropupTop);
				handled = true;
			}
			else if (tagTop > downSpace) { // The "+" button is lower than middle.
				if (tagTop > 400) { // Consider to drop up if space above the "+" button is more than 400px.
					dropdownHeigh = tagTop - this.tagPanel.height();
					dropupTop = -(dropdownHeigh + this.tagPanel.height()) - 10;
					this.dropdownMenu.css('top', dropupTop);
					this.dropdownMenu.css('max-height', dropdownHeigh);
					handled = true;
				}
			}
			if (!handled) { // Not handled
				this.dropdownMenu.css('max-height', Math.max(downSpace - 200, 400)); // Overflow downward but no more than 400px.
			}
		} else {
			this.dropdownMenu.css('top', 'auto');
		}

		this.searchBox.val('');
		this.searchItem();
		this.dropdownPanel.show();
		this.searchBox.focus();
	}

	hideDropdown() {
		this.dropdownPanel.hide();
	}

	searchItem() {
		let value = this.searchBox.val().toLowerCase();
		$('label', this.dropdownMenu).each(function (i, item) {
			if ($(item).text().trim().toLowerCase().indexOf(value) >= 0) {
				$(item).show();
			}
			else {
				$(item).hide();
			}
		});
	}

	selectItem(item) {
		let element = $(item);
		if (element.is(':checkbox')) {
			// Move forward on list
			element.closest('label').insertBefore($('.dropdown-divider', this.context));

			// Add to tag panel
			let tag = $('.jesse-tags>div', this.context).first().clone().removeClass('d-none');
			tag.html(tag.html().replaceAll('xxx', element.closest('label').text().trim()))
			this.tagPanel.append(tag);
		}

		let values = this.getSelectedItems();
		this.hiddenField.val(values)
		if (typeof this.onchange == 'function') {
			this.onchange(values);
		}
	}

	deselectItem(item) {
		let label;
		if (typeof (item) == 'string') { // item text
			let text = item.trim();
			label = $('.jesse-dropdown-menu label', this.context).filter(function (i, item) {
				return $(item).text().trim() == text;
			}).first();
			label.children(':checkbox').prop('checked', false);
		}
		else if (typeof (item) == 'object') { // item checkbox
			let element = $(item);
			if (element.is(':checkbox')) {
				label = element.closest('label');
			}
		}
		if (label) {
			// Move backward on list
			label.insertAfter($('.dropdown-divider', this.context));

			// Remove from tag panel
			let span = $('span', this.tagPanel).filter(function (i, item) {
				return $(item).text().trim() == label.text().trim();
			}).first();
			span.closest('.jesse-tag-item').remove();
		}

		let values = this.getSelectedItems();
		this.hiddenField.val(values)
		if (typeof this.onchange == 'function') {
			this.onchange(values);
		}
	}

	getSelectedItems() {
		let arr = [];
		$(':checkbox:checked', this.dropdownMenu).each(function () {
			arr.push(this.value);
		});
		return arr;
	}
}