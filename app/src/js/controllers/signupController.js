function SignupController()
{

// redirect to homepage on new account creation, add short delay so user can read alert window //
	console.log($('.modal-alert #ok'));
	$('.modal-alert #ok').click(function(){
		console.log('ok clicked');
		setTimeout(function(){
			window.location.href = '/'; //redirect with client side js
			}, 300)
	});
}
