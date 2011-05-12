
/*
 * Linkit javascript lib 
 */
 var linkit_helper = {};

(function ($) {
linkitHelper = {
  /*
   * Makes an AJAX request when a link is about to be edited with Linkit
   */
  search_styled_link : function(string) {
    $('#linkit .form-item-link input').hide();
    $('#linkit .form-item-link label').after($('<span></span>').addClass('throbber').html('<strong>' + Drupal.t('Loading path...') + '</strong>'));
    // DO AJAX!
    var result = $.get(Drupal.settings.linkit.ajaxcall, { string: string } , function(data) {
      if(data) {
        $('#linkit #edit-link--2').val(data);
        $('#linkit .form-item-link .throbber').remove();
        $('#linkit .form-item-link input').show();
      } else {
        $('#linkit #edit-link--2').val(string);
        $('#linkit .form-item-link .throbber').remove();
        $('#linkit .form-item-link input').show();
      }
    });
  }, 

  /*
   * Show helper text
   * If there is no selection, the link text will be the result title.
   */
  populateTitle : function(title) {
    $('#linkit #edit-text').val(title);
  },
  /*
   * IMCE integration
   */
  openFileBrowser : function () {
    window.open(decodeURIComponent(Drupal.settings.linkit.IMCEurl), '', 'width=760,height=560,resizable=1');
  },
  
  /*
   * See if the link contains a #anchor
   */
  findAnchor : function(href) {
    var matches = href.match(/.*(#.*)/i);
    anchor = (matches == null) ? '' : matches[1].substring(1);
    return anchor;
  }
};

Drupal.behaviors.linkitImce =  {
  attach: function(context, settings) {
    $('#linkit-imce').click(function() {
      linkit_helper.openFileBrowser();
      return false;
    });
  }
};

/**
 * Create an autocomplete object instance from a DOM input element by
 * providing a JSON path
 * 
 * The DOM tree will look like this:
 * 
 * input (text input field, provided as the $input argument)
 * div#linkit-autocomplete-wrapper (no width/height, position relative)
 *   ul#linkit-autocomplete-results (fixed width, variable height)
 *     li.result (variable height)
 *       h4.title (contains the title)
 *       p.description (contains the description)
 *     li.result (more results...)
 * 
 * @param $input The input element wrapped in jQuery
 * @param path A path which provides JSON objects upon search. This path should
 *        print a JSON array containing result objects. Each result object
 *        should contain at least a title or description key. All other keys
 *        are for the developer to define.
 * @param callback A callback function to execute when an item selection is
 *        confirmed. The callback function recieves an argument which is the
 *        JSON object that was selected.
 * @param options An object with additional options:
 *      - charLimit (default=3) The minimum number of chars to do an AJAX call
 *      - wait (default=100) The time in ms between a key is pressed and AJAX call
 *      - getParam (default="s") The get parameter for AJAX calls: "?param=search"
 *      - ajaxTimeout (default=5000) Timeout on AJAX calls
 */
var AutoCompleteObject = function($input, path, callback, options) {
  var self = this;

  var options = $.extend({
    charLimit: 3,
    wait: 100,
    getParam: 's',
    ajaxTimeout: 5000
  }, options);

  // A key-value object, key is search string, value is a result object
  var results = {};

  // The user's current string input
  var userString = $input.val();

  // Turn off the browser's autocompletion
  $input.attr('autocomplete', 'OFF').attr('aria-autocomplete', 'none');

  var $resultList = $('<ul />').attr('id', 'linkit-autocomplete-results').width($input.innerWidth());
  var $wrapper = $('<div />').append($resultList).attr('id', 'linkit-autocomplete-wrapper').insertAfter($input);

  $input.focus(function() {
    $wrapper.show();
  });
  $input.blur(function() {
    $wrapper.hide();
    return false;
  });
  $input.keyup(function() {
    // If the results can't be displayed we must fetch them, then display
    if (!self.renderResults()) {
      self.fetchResults($input.val(), function(data, search) {
        results[search] = data;
        self.renderResults();
      });
    }
  });

  // When the user hovers a result with the mouse, select it
  $('.result', $resultList[0]).live('mouseover', function() {
    $('.result.selected', $resultList).removeClass('selected');
    $(this).addClass('selected');
  });

  // A result is inserted
  // TODO: Move most code to new method self.selectResult(id) so it can also be keyboard navigated
  $('.result', $resultList[0]).live('mousedown', function() {
    // If a callback is provided, call it now
    if (typeof callback === 'function')
      callback($(this).data('result'));
  });

  self.setStatus = function(string) {
    self.status = string;
    switch (string) {
    case 'loading':
      $input.addClass('throbbing');
      break;
    }
  };

  /**
   * Fetch results asynchronously via AJAX
   * Errors are ignored.
   * 
   * @param search The search string
   * @param callback The callback function on success. Takes two
   *        arguments: data (array of results), search string
   */
  self.fetchResults = function(search, callback) {
    $input.addClass('throbbing');
    var xhr = $.ajax({
      url: path,
      dataType: 'json',
      data: {s: search},
      context: search,
      timeout: options.ajaxTimeout,
      success: function(data, textStatus) {
        // TODO: Keep count of how many calls are active, when 0 remove throbber
        $input.removeClass('throbbing');
        callback(data, this);
      }
    });
  };

  /**
   * Put the mouse cursor in this autocomplete field
   */
  self.focus = function() {
    $input.focus();
  };

  /**
   * Display results from a certain string
   * Returns true if displayed properly
   */
  self.renderResults = function() {

    // Update user string
    userString = $input.val();
    
    $resultList.empty();

    if (userString.length < options.charLimit) {
      $wrapper.hide();
      return true;
    }

    // The result is not in cache, so there is nothing to display right now
    if (typeof results[userString] !== 'object') {
      $wrapper.hide();
      return false;
    }
    for (i in results[userString]) {

      // Shortname for this result
      var result = results[userString][i];

      // If we don't have title or description, we don't have much to display
      if (typeof result.title === 'undefined' && typeof result.description === 'undefined')
        continue;
      var $result = $('<li />').addClass('result')
        .append(
            (typeof result.title !== 'undefined' ? '<h4>' + result.title + '</h4>' : '') + 
            (typeof result.description !== 'undefined' ? '<p>' + result.description + '</p>' : '')
        )
        .data('result', result) // Store the result object on this DOM element
        .appendTo($resultList);
      $wrapper.show();
      // Select the first result
      if (i == 0) {
        $result.addClass('selected');
      }
    }
    return true;
  };
};

Drupal.behaviors.linkitAutocomplete = {
  attach: function(context, settings) {
    var aco = new AutoCompleteObject($('#linkit #edit-search', context), 'http://d7.dev/linkit/autocomplete', function(linkObject) {
      // Select callback is executed when an object is chosen
      // Only change the link text if it is empty
      $('#linkit #edit-text:text[value=""]').val(linkObject.title);
      $('#linkit #edit-path').val(linkObject.path);
    });
    if (context === window.document) {
      // TODO: Make autofocus with html5?
      aco.focus();
    }
  }
};

})(jQuery);
