var React  = require('react'),
    $      = require('jquery'),
    BS     = require('react-bootstrap'),
    Button = BS.Button,
    Modal  = BS.Modal;

module.exports = $.extend(BS.OverlayMixin, {
  toggleModal: function() {
    this.setState({isModalOpen: !this.state.isModalOpen});
  },

  renderOverlay: function() {
    if (!this.state.isModalOpen) {
      return <span />;
    }

    var modalBody, modalTitle, modalStyle;

    if (this.state.errors) {
      modalBody = this.renderErrorMessage();
      modalTitle = this.errorModalTitle;
      modalStyle = 'danger';
    } else {
      modalBody = this.renderSuccessMessage();
      modalTitle = this.successModalTitle;
      modalStyle = 'primary';
    }

    return (
      <Modal bsStyle={modalStyle}
             title={modalTitle}
             onRequestHide={this.toggleModal}>

        <div className='modal-body'>
          {modalBody}
        </div>

        <div className='modal-footer'>
          <Button onClick={this.toggleModal}>Close</Button>
        </div>
      </Modal>
    );
  }
});
