function Message (sender, args) {
  this.sender = 'object' === typeof sender ? sender.address : sender
  this.args = args
}

exports.Message = Message
