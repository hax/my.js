void function(root){
	var bag = {}
	root['my:lookup'] = function lookup(id) {
		return bag['$' + id] || (bag['$' + id] = {})
	}
}(this)