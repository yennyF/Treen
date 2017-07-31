class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  private
	def current_user
		User.where(id: session[:user_id]).first
	end
	helper_method :current_user

	def authorize
		redirect_to '/home' unless current_user
	end
end
