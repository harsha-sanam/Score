import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Score';
  newPlayer: string;
  Players: string[] = [];


  Score: any = {};

  ngOnInit() {
    this.Players = JSON.parse(localStorage.getItem('players')) ? JSON.parse(localStorage.getItem('players')) : [];
    this.Score = JSON.parse(localStorage.getItem('score'));
    if (!this.Score) {
      this.InitScore();
    }
    console.log(this.Players);
    console.log(this.Score);
  }

  AddScore() {
    for (var i = 0; i < this.Players.length; i++) {
      var score = Number((<HTMLInputElement>document.getElementById(this.Players[i])).value);
      this.Score.Scores[this.Players[i]].push(score);
      (<HTMLInputElement>document.getElementById(this.Players[i])).value = "";
    }
    this.Score.Games = this.Score.Games + 1;
    this.updateScore();
  } 
  ClearStorage() {
    localStorage.clear();
  }
  AddPlayer() {
    if (!confirm("All Data will be lost")) {
      return;
    }
    if (this.Players.indexOf(this.newPlayer) >= 0) {
      return;
    }
    this.Players.push(this.newPlayer);
    this.newPlayer = "";
    this.updatePlayers();
    this.InitScore();
  }
  InitScore() {
    this.Score = {};
    this.Score.Scores = {};
    this.Score.Games = 0;
    for (var i = 0; i < this.Players.length; i++) {
      this.Score.Scores[this.Players[i]] = [];
    }
    this.updateScore();
  }
  sum(player: string) {
    return this.Score.Scores[player]?this.Score.Scores[player].reduce(function (a, b) {
      return a + b;
    }, 0):null;
  }

  RemovePlayer(player: string) {
    this.Players = this.Players.filter(a => a.toLowerCase() != player.toLowerCase());
    this.updatePlayers();
  }

  updatePlayers() {
    localStorage.setItem('players', JSON.stringify(this.Players));
  }
  updateScore() {
    localStorage.setItem('score', JSON.stringify(this.Score));
  }

}
