
// TODO: rename this file, for easier debugging

var linkitDialog = {};

(function ($) {

linkitDialog = {
  init : function() {
    var ed = tinyMCEPopup.editor;

    if (e = ed.dom.getParent(ed.selection.getNode(), 'A')) {
      $('#edit-title').val($(e).attr('title'));
      $('#edit-id').val($(e).attr('id'));
      $('#edit-class').val($(e).attr('class'));
      $('#edit-rel').val($(e).attr('rel'));
      $('#edit-accesskey').val($(e).attr('accesskey'));

      Drupal.linkit.populateLink($(e).html(), $(e).attr('href'), true);
    }
    else {
      // TODO: Change all linkitHelper references to
      // Drupal.linkit.<new_function_name>
      Drupal.linkit.populateLink(ed.selection.getContent(), $(e).attr('href'), true);
    }
  },

  insertLink : function() {
    var ed = tinyMCEPopup.editor, e;

    tinyMCEPopup.restoreSelection();
    e = ed.dom.getParent(ed.selection.getNode(), 'A');

    if ($('#edit-path').val() == "") {
      // Remove element if there is no href
      if (e) {
        tinyMCEPopup.execCommand("mceBeginUndoLevel");
        ed.dom.remove(e, 1);
        tinyMCEPopup.execCommand("mceEndUndoLevel");
        tinyMCEPopup.close();
        return;
      }
      tinyMCEPopup.close();
      return;
    }
    
    tinyMCEPopup.execCommand("mceBeginUndoLevel");

    var link_path = $('#edit-path').val();
    var link_text = $('#edit-text').val();

    // Create new anchor elements
    if (e == null) {
      
      if (ed.selection.isCollapsed()) {
        tinyMCEPopup.execCommand("mceInsertContent", false, '<a href="#linkit-href#">' + link_text + '</a>');
      } else {
        tinyMCEPopup.execCommand("createlink", false, '#linkit-href#', {skip_undo : 1});
      }
        
      tinymce.each(ed.dom.select("a"), function(n) {
        if (ed.dom.getAttrib(n, 'href') == '#linkit-href#') {
          e = n;

          ed.dom.setAttribs(e, {
            'href'      : link_path,
            'title'     : $('#edit-title').val(),
            'id'        : $('#edit-id').val(),
            'class'     : $('#edit-class').val(),
            'rel'       : $('#edit-rel').val(),
            'accesskey' : $('#edit-accesskey').val()
          });
        }
      });
    } else {
      ed.dom.setAttribs(e, {
        'href'      : link_path,
        'title'     : $('#edit-title').val(),
        'id'        : $('#edit-id').val(),
        'class'     : $('#edit-class').val(),
        'rel'       : $('#edit-rel').val(),
        'accesskey' : $('#edit-accesskey').val()
      });
    }
    // Don't move caret if selection was image
    if(e != null) {
      if (e.childNodes.length != 1 || e.firstChild.nodeName != 'IMG') {
        ed.focus();
        ed.selection.select(e);
        ed.selection.collapse(0);
        tinyMCEPopup.storeSelection();
      }
    }

    tinyMCEPopup.execCommand("mceEndUndoLevel");
    tinyMCEPopup.close();

  }
};


tinyMCEPopup.onInit.add(linkitDialog.init, linkitDialog);

/*
 * TODO: Shouldn't it be the other way around, i.e that these editor specific
 * scripts attaches callbacks to the Drupal.linkit object instead so that
 * these files does not need to do any DOM manipulation etc.?
 */
Drupal.behaviors.linkitInitTinyMCE =  {
  attach: function(context, settings) {
    $('#edit-link', context).keydown(function(ev) {
      if (ev.keyCode == 13) {
        // Prevent browsers from firing the click event on the first submit
        // button when enter is used to select from the autocomplete list.
        return false;
      }
    });
    $('#edit-insert', context).click(function() {
      linkitDialog.insertLink();
      return false;
    });

    $('#linkit #cancel', context).click(function() {
      tinyMCEPopup.close();
    });
  }
};

})(jQuery);