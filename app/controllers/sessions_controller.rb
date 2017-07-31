class SessionsController < ApplicationController

	def create
		user = User.getUserByUsername(params[:authenticate_username])
		if user && user.authenticate(params[:authenticate_password])
			session[:user_id] = user.id
			redirect_to controller: 'documents'
		else
		  	#redirect_to controller: 'home'
		  	render json: {errors: {
		  		authenticate_username: " ",
		  		authenticate_password: "Nombre de usuario y/o contraseña inválida"
		  	}}
		end
	end

	def destroy
		session[:user_id] = nil
		redirect_to controller: 'home'
	end
end
